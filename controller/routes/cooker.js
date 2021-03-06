const Cooker = require('../../models/cooker');
const Menu = require('../../models/menu');
const Type_has_menu = require('../../models/type_has_menu');
const Date_booking = require('../../models/date_booking');
const Comment = require('../../models/comment');
const jwt = require('jsonwebtoken');
const auth = require('../config/auth');
const multer = require('multer');
const fs = require('fs');
const Type = require('../../models/type');
const Reservation = require('../../models/reservation');
const User = require('../../models/user');

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
                password,
                picture: 'user.png'
            };
            const logCooker = await Cooker.create(cooker);
            const cook = await Cooker.findOne({
                where: {
                    id: logCooker.id
                },
                include: [
                    {
                        model: Reservation,
                        include: [
                            {
                                model: User,
                            },
                            {
                                model: Menu
                            },
                            {
                                model: Date_booking
                            }
                        ]
                    }, {
                        model: Date_booking,
                    }
                ]
            });

            const token = jwt.sign({ data: req.body.email, exp: Math.floor(Date.now() / 1000) + (60 * 60) }, 'secret');
            try {
                const mailContent = await Email.registerCooker(
                    req.body.firstname,
                );
                const mailOptions = {
                    from: '"Cuizine Pou Zot" alekz.contact.webdev@gmail.com', // sender address
                    to: req.body.email, // list of receivers
                    subject: 'Inscription chez Cuizine Pou Zot', // Subject line
                    html: mailContent,
                };
                Email.transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error, 'ERROR MAIL NOT SEND')
                    }
                    console.log(info, 'INFO MAIL TO SEND')
                });
                res.json({ logCooker: cook, token, type: 'cooker', message: `Bienvenue parmis nous chef ${cook.first_name}, vous pouvez désormais avoir accés à votre profil !` });
            } catch (err) {
                res.sendStatus(401)
            }
        } else {
            res.json({ message: 'Désolé mais il semblerait que ce compte exist déjà !' })
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
                        model: Reservation,
                        include: [
                            {
                                model: User,
                            },
                            {
                                model: Menu
                            },
                            {
                                model: Date_booking
                            }
                        ]
                    }, {
                        model: Date_booking,
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
                imgOrigin = 'mer.png';
            }
            sequelize.transaction().then(async t => {
                try {
                    const cooker = await Cooker.findOne({
                        where: {
                            email: userAuth.data,
                        }
                    }, { transaction: t });
                    const menu = {
                        title: meta.title,
                        start: meta.start,
                        dish: meta.dish,
                        dessert: meta.dessert,
                        price: meta.price,
                        cooker_id: cooker.id,
                        draft: meta.draft,
                        picture: imgOrigin
                    };
                    const createMenu = await Menu.create(menu, { transaction: t });
                    meta.type.map(async (type) => {
                        if (type.length > 0) {
                            await Type_has_menu.create({ type_id: type, menu_id: createMenu.id })
                        }
                    });
                    if (fileToUpload) {
                        const src = fs.createReadStream(tmpPath);
                        const dest = fs.createWriteStream(targetPath);
                        src.pipe(dest);
                        fs.unlink(tmpPath);
                    }
                    await t.commit();
                    res.json({ newMenu: createMenu });
                } catch (err) {
                    await t.rollback();
                    res.sendStatus(401);
                }
            });
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
            console.log('ERROR NOT AUTH')
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

                    await t.commit();
                    if (fileToUpload) {
                        const src = fs.createReadStream(tmpPath);
                        const dest = fs.createWriteStream(targetPath);
                        src.pipe(dest);
                        fs.unlink(tmpPath);
                    }
                    res.json({ menu: menuUpdated });
                } catch (err) {
                    await t.rollback();
                    res.sendStatus(401);
                }
            });
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
                            book: false,
                        }
                    }, { transaction: t });
                    const dates = await Date_booking.bulkCreate(dateBook, { transaction: t });
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
    app.get('/menu_type/:menuId', async (req, res) => {
        const types = await Type_has_menu.findAll({
            where: {
                menu_id: req.params.menuId
            },
            include: [
                {
                    model: Type
                }
            ]
        });
        try {
            res.json({ types })
        } catch (err) {
            res.sendStatus(304)
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