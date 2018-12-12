const Menu = require('../models/menu');
const Cooker = require('../models/cooker');
const User = require('../models/user');
const Comment = require('../models/comment');
const Type_has_menu = require('../models/type_has_menu');
const Type = require('../models/type');
const fs = require('fs');
const dotEnv = require('dotenv');
const sequelize = require('../database/db');
const Date_booking = require('../models/date_booking');
dotEnv.config();


class menuController {
    async getMenus(req, res) {
        if (Object.keys(req.query).length === 0) {
            const menus = await Menu.findAll({
                where: {
                    draft: false
                },
                include: [
                    {
                        model: Cooker,
                        attributes: ['last_name', 'first_name', 'id'],
                    },
                    {
                        model: Type_has_menu,
                        include: [
                            {
                                model: Type
                            }
                        ]
                    }
                ],
                order: [['id', 'DESC']]
            });
            res.json({ menus })
        } else {
            const menus = await Menu.findAll({
                where: {
                    draft: false
                },
                include: [
                    {
                        model: Type
                    }
                ],
                include: [{
                    model: Type_has_menu,
                    include: [
                        {
                            model: Type
                        }
                    ],
                    where: {
                        type_id: req.query.type
                    },
                }, {
                    model: Cooker,
                    attributes: ['last_name', 'first_name', 'id'],
                }
                ],
                order: [['id', 'DESC']]
            });
            res.json({ menus })
        }
    };

    async menuChef(req, res) {
        const menusByChef = await Cooker.findOne({
            where: {
                id: req.params.chefId
            },
            include: [
                {
                    model: Menu,
                    include: [
                        {
                            model: Comment,
                            include: [
                                {
                                    model: User
                                }
                            ]
                        },
                        {
                            model: Type_has_menu,
                            include: [
                                {
                                    model: Type,
                                    attributes: ['name']
                                }
                            ]
                        },

                    ]
                },

            ]
        });
        res.json({
            menusByChef
        });
    };
    async getTypes(req, res) {
        const types = await Type.findAll({});
        res.json({ types })
    };
    async getImages(req, res) {
        if (req.params.model === 'Cooker') {
            const cooker = await Cooker.findOne({
                where: {
                    id: req.params.id
                }
            });
            fs.readFile(`public/images/${cooker.picture}`, function (err, data) {
                try {
                    res.contentType('image/png');
                    res.end(data, 'binary');
                } catch (err) {
                    // throw new Error(err)
                }
            });
        } else if (req.params.model === 'User') {
            const user = await User.findOne({
                where: {
                    id: req.params.id
                }
            });
            fs.readFile(`public/images/${user.picture}`, function (err, data) {
                try {
                    res.contentType('image/png');
                    res.end(data, 'binary');
                } catch (err) {
                    // throw new Error(err)
                }
            });
        } else {
            const menu = await Menu.findOne({
                where: {
                    id: req.params.id
                }

            });
            fs.readFile(`public/images/${menu.picture}`, function (err, data) {
                try {
                    res.contentType('image/png');
                    res.end(data, 'binary');
                } catch (err) {
                    // throw new Error(err)
                }
            })
        }
    };
    async getMenu(req, res) {
        try {
            const menu = await Menu.findOne({
                where: {
                    id: req.params.id
                },
                include: [
                    {
                        model: Comment,
                        include: [
                            {
                                model: User
                            }
                        ]
                    }, {
                        model: Cooker,
                        include: [
                            {
                                model: Date_booking,
                                where: {
                                    book: false
                                }
                            }
                        ]

                    }, {
                        model: Type_has_menu,
                        include: [
                            {
                                model: Type
                            }
                        ]
                    }
                ],

            });
            res.json({ menu });
        } catch (err) {
            res.sendStatus(401);
        }
    }
    async createMenu(req, res) {
        const userAuth = req.token
        const fileToUpload = req.file;
        const meta = JSON.parse(req.body.data);
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
                });
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
                        return await Type_has_menu.create({ type_id: type, menu_id: createMenu.id });
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
    async deleteMenu(req, res) {
        const userAuth = req.token;
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
    };
    async updateMenu(req, res) {
        const userAuth = req.token;
        const fileToUpload = req.file;
        const meta = JSON.parse(req.body.data);
        sequelize.transaction().then(async t => {
            try {
                const cooker = await Cooker.findOne({
                    where: {
                        email: userAuth.data,
                    },
                });

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
                });
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
    };
    async getTypesByMenu(req, res) {
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
    }
    async menusByCooker(req, res) {
        try {
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

            res.json({ menus })
        } catch (err) {
            res.sendStatus(304)
        }
    }
};

module.exports = new menuController();
