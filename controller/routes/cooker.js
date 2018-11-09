const Cooker = require('../../models/cooker');
const Menu = require('../../models/menu');
const Type_has_menu = require('../../models/type_has_menu');
const Date_booking = require('../../models/date');
const Comment = require('../../models/comment');
const jwt = require('jsonwebtoken');
const auth = require('../config/auth');
const multer = require('multer');
const fs = require('fs');
const Type = require('../../models/type');
const upload = multer({
    dest: 'public/images', // upload target directory
});

const cooker = (app, sequelize) => {

    app.post('/profil-cooker', async (req, res) => {
        const verifyCooker = await Cooker.find({
            where: {
                email: req.body.email
            }
        });
        if (!verifyCooker) {
            const password = Cooker.generateHash(req.body.password);
            const cooker = {
                last_name: req.body.lastname,
                first_name: req.body.firstname,
                email: req.body.email,
                password
            };
            const logCooker = await Cooker.create(cooker);
            const token = jwt.sign({ data: req.body.email, exp: Math.floor(Date.now() / 1000) + (60 * 60) }, 'secret');
            try {
                res.json({ logCooker, token, type: 'cooker' });
            } catch (err) {
                res.sendStatus(401)
            }
        } else {
            res.json({ message: 'Cooker already exist' })
        }

    });
    app.put('/profil-cooker/:id', auth.verifyToken, upload.single('avatar'), async (req, res) => {
        const fileToUpload = req.file;
        const userAuth = auth.checkToken(req.token);
        const meta = JSON.parse(req.body.data);
        if (!userAuth) {
            res.status(401).json({ message: 'User not connected' })
        } else {
            const cooker = await Cooker.findOne({
                where: {
                    email: userAuth.data,
                    id: req.params.id
                },
                include: [
                    {
                        model: Date_booking
                    }
                ]
            });
            let targetPath;
            let tmpPath;
            let imgOrigin;
            if (fileToUpload) {
                const extension = fileToUpload.mimetype.split('/');
                targetPath = `public/images/${fileToUpload.filename}.${extension[1]}`;
                tmpPath = fileToUpload.path;
                imgOrigin = `${fileToUpload.filename}.${extension[1]}`;
            } else {
                imgOrigin = cooker.picture;
            }

            const updateCooker = {
                last_name: meta.lastname,
                first_name: meta.firstname,
                picture: imgOrigin,
                presentation: meta.presentation
            }
            const cookerUpdated = await cooker.update(updateCooker);
            if (fileToUpload) {
                const src = fs.createReadStream(tmpPath);
                const dest = fs.createWriteStream(targetPath);
                src.pipe(dest);
                fs.unlink(tmpPath);
            }
            try {
                res.json({ cookerUpdated, type: 'cooker' })
            } catch (err) {
                res.json({ err })
            }
        }
    });

    app.post('/menu', auth.verifyToken, upload.single('picture'), async (req, res) => {
        const fileToUpload = req.file;
        const userAuth = auth.checkToken(req.token);
        const meta = JSON.parse(req.body.data);
        if (!userAuth) {
            res.status(401).json({ message: 'User not connected' })
        } else {
            let targetPath;
            let tmpPath;
            let imgOrigin;
            if (fileToUpload) {
                const extension = fileToUpload.mimetype.split('/');
                targetPath = `public/images/${fileToUpload.filename}.${extension[1]}`;
                tmpPath = fileToUpload.path;
                imgOrigin = `${fileToUpload.filename}.${extension[1]}`;
            } else {
                imgOrigin = 'user.png';
            }
            sequelize.transaction().then(async t => {
                try {
                    const cooker = await Cooker.findOne({
                        where: {
                            email: userAuth.data,
                        }
                    }, { transaction: t });
                    console.log(imgOrigin)
                    const menu = {
                        title: meta.title,
                        start: meta.start,
                        dish: meta.dish,
                        dessert: meta.dessert,
                        nb_guest: 2,
                        price: meta.price,
                        cooker_id: cooker.id,
                        draft: meta.draft,
                        picture: imgOrigin
                    };
                    const createMenu = await Menu.create(menu, { transaction: t });
                    meta.type.map(async (type) => {
                        if (type.length > 0) {
                            await Type_has_menu.create({ type_id: type, menu_id: createMenu.id }, { transaction: t })
                        }
                    });
                    const newMenu = await Menu.findOne({
                        where: {
                            id: createMenu.id
                        },
                        include: [
                            {
                                model: Type_has_menu,
                                include: [
                                    {
                                        model: Type
                                    }
                                ]
                            }
                        ]
                    }, { transaction: t });
                    await t.commit();
                } catch (err) {
                    console.log('err', err)
                    await t.rollback();
                }
            });
            if (fileToUpload) {
                const src = fs.createReadStream(tmpPath);
                const dest = fs.createWriteStream(targetPath);
                src.pipe(dest);
                fs.unlink(tmpPath);
            }
            try {
                res.json({ createMenu: newMenu });
            } catch (err) {
                res.sendStatus(401);
            }
        }
    });
    app.delete('/menu/:id', auth.verifyToken, async (req, res) => {
        const userAuth = auth.checkToken(req.token);
        if (!userAuth) {
            res.status(401).json({ message: 'User not connected' })
        } else {
            const menu = await Menu.findOne({
                where: {
                    id: req.params.id
                }
            });
            const cooker = await Cooker.findOne({
                where: {
                    email: userAuth.data,
                }
            });
            if (menu) {
                if (menu.cooker_id === cooker.id) {
                    await menu.destroy();
                    fs.unlink(`public/images/${menu.picture}`, (err2) => {
                        if (err2 && err2.code !== 'ENOENT') { // 'ENOENT' : file doesn't exist
                            logger.error(`Error deleting file : ${err2}`);
                        }
                    });
                    res.sendStatus(200);
                }
            } else {
                res.sendStatus(400);
            }
        }
    });
    app.put('/menu/:id', auth.verifyToken, upload.single('picture'), async (req, res) => {
        const userAuth = auth.checkToken(req.token);
        const fileToUpload = req.file;
        const meta = JSON.parse(req.body.data);
        if (!userAuth) {
            res.status(401).json({ message: 'User not connected' })
        } else {
            sequelize.transaction().then(async t => {
                try {
                    const cooker = await Cooker.findOne({
                        where: {
                            email: userAuth.data,
                        },
                    }, { transaction: t });

                    const menu = await Menu.findOne({
                        where: {
                            id: req.params.id
                        }
                    }, { transaction: t });
                    let targetPath;
                    let tmpPath;
                    let imgOrigin;
                    if (fileToUpload) {
                        const extension = fileToUpload.mimetype.split('/');
                        targetPath = `public/images/${fileToUpload.filename}.${extension[1]}`;
                        tmpPath = fileToUpload.path;
                        imgOrigin = `${fileToUpload.filename}.${extension[1]}`;
                        fs.unlink(`public/images/${menu.picture}`, (err2) => {
                            if (err2 && err2.code !== 'ENOENT') { // 'ENOENT' : file doesn't exist
                                logger.error(`Error deleting file : ${err2}`);
                            }
                        });
                    } else {
                        imgOrigin = menu.picture;
                    }

                    const typeHasMenu = await Type_has_menu.destroy({
                        where: {
                            menu_id: menu.id
                        }
                    }, { transaction: t });
                    meta.type.map(async (type) => {
                        if (type.length > 0) {
                            await Type_has_menu.create({ type_id: type, menu_id: menu.id }, { transaction: t })
                        }
                    });
                    const metaMenu = {
                        title: meta.title,
                        start: meta.start,
                        dish: meta.dish,
                        dessert: meta.dessert,
                        nb_guest: 2,
                        price: meta.price,
                        cooker_id: cooker.id,
                        draft: meta.draft,
                        picture: imgOrigin
                    };
                    const menuUpdated = await menu.update(metaMenu, { transaction: t });
                    const menuType = await Menu.findOne({
                        where: {
                            id: menuUpdated.id
                        },
                        include: [
                            {
                                model: Type_has_menu,
                                include: [
                                    {
                                        model: Type
                                    }
                                ]
                            }
                        ]
                    }, { transaction: t });
                    await t.commit();
                } catch (err) {
                    console.log(err, 'error transaction')
                    await t.rollback();
                }
            });
            if (fileToUpload) {
                const src = fs.createReadStream(tmpPath);
                const dest = fs.createWriteStream(targetPath);
                src.pipe(dest);
                fs.unlink(tmpPath);
            }
            try {
                res.json({ menu: menuType });
            } catch (err) {
                res.sendStatus(401);
            }
        }
    });
    app.post('/date', auth.verifyToken, async (req, res) => {
        const userAuth = auth.checkToken(req.token);
        if (!userAuth) {
            res.status(401).json({ message: 'User not connected' })
        } else {
            sequelize.transaction().then(async t => {
                try {
                    const cooker = await Cooker.findOne({
                        where: {
                            email: userAuth.data
                        }
                    }, { transaction: t });

                    const booking = await Date_booking.destroy({
                        where: {
                            cooker_id: cooker.id,
                            book: false
                        }
                    });

                    const dateBook = req.body.date.map((date) => {
                        return {
                            date,
                            cooker_id: cooker.id,
                            book: false
                        }
                    }, { transaction: t });
                    console.log(dateBook, 'new array')
                    // const arrayResolve = await Promise.all(dateBook)
                    // console.log(arrayResolve, 'RESOLVE ARRAY')
                    const dates = await Date_booking.bulkCreate(dateBook, { transaction: t })
                    console.log(dates, 'GET DATES')
                    await t.commit();
                    res.status(200).json({ dates });
                } catch (err) {
                    res.sendStatus(401);
                    await t.rollback();
                    console.log(err)
                }
            });
        }
    });
    app.get('/menus_cooker/:id', async (req, res) => {
        const menus = await Menu.findAll({
            where: {
                cooker_id: req.params.id
            },
            include: [
                {
                    model: Type_has_menu,
                    include: [
                        {
                            model: Type
                        }
                    ]
                }
            ]
        });
        try {
            res.json({ menus })
        } catch (err) {
            res.sendStatus(304)
        }
    })
}

module.exports = cooker;