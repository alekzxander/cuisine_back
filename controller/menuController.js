const fs = require('fs');
const dotEnv = require('dotenv');
const sequelize = require('../database/db');
dotEnv.config();


class menuController {
    constructor(Menu, Cooker, User, Comment, Type_has_menu, Type, Date_booking) {
        this.menu = Menu;
        this.cooker = Cooker;
        this.user = User;
        this.comment = Comment;
        this.type_has_menu = Type_has_menu;
        this.type = Type;
        this.date_booking = Date_booking;
        this.getMenus = this.getMenus.bind(this);
        this.menuChef = this.menuChef.bind(this);
        this.getTypes = this.getTypes.bind(this);
        this.getImages = this.getImages.bind(this);
        this.getMenu = this.getMenu.bind(this);
        this.createMenu = this.createMenu.bind(this);
        this.deleteMenu = this.deleteMenu.bind(this);
        this.updateMenu = this.updateMenu.bind(this);
        this.getTypesByMenu = this.getTypesByMenu.bind(this);
        this.menusByCooker = this.menusByCooker.bind(this);
    }
    async getMenus(req, res) {
        if (Object.keys(req.query).length === 0) {
            const menus = await this.menu.findAll({
                where: {
                    draft: false
                },
                include: [
                    {
                        model: this.cooker,
                        attributes: ['last_name', 'first_name', 'id'],
                    },
                    {
                        model: this.type_has_menu,
                        include: [
                            {
                                model: this.type
                            }
                        ]
                    }
                ],
                order: [['id', 'DESC']]
            });
            res.json({ menus })
        } else {
            const menus = await this.menu.findAll({
                where: {
                    draft: false
                },
                include: [
                    {
                        model: this.type
                    }
                ],
                include: [{
                    model: this.type_has_menu,
                    include: [
                        {
                            model: this.type
                        }
                    ],
                    where: {
                        type_id: req.query.type
                    },
                }, {
                    model: this.cooker,
                    attributes: ['last_name', 'first_name', 'id'],
                }
                ],
                order: [['id', 'DESC']]
            });
            res.json({ menus })
        }
    };

    async menuChef(req, res) {
        const menusByChef = await this.cooker.findOne({
            where: {
                id: req.params.chefId
            },
            include: [
                {
                    model: this.menu,
                    include: [
                        {
                            model: this.comment,
                            include: [
                                {
                                    model: this.user
                                }
                            ]
                        },
                        {
                            model: this.type_has_menu,
                            include: [
                                {
                                    model: this.type,
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
        const types = await this.type.findAll({});
        res.json({ types })
    };
    async getImages(req, res) {
        if (req.params.model === 'Cooker') {
            const cooker = await this.cooker.findOne({
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
            const user = await this.user.findOne({
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
            const menu = await this.menu.findOne({
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
            const menu = await this.menu.findOne({
                where: {
                    id: req.params.id
                },
                include: [
                    {
                        model: this.comment,
                        include: [
                            {
                                model: this.user
                            }
                        ]
                    }, {
                        model: this.cooker,
                        include: [
                            {
                                model: this.date_booking,
                                where: {
                                    book: false
                                }
                            }
                        ]

                    }, {
                        model: this.type_has_menu,
                        include: [
                            {
                                model: this.type
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
                const cooker = await this.cooker.findOne({
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
                const createMenu = await this.menu.create(menu, { transaction: t });
                meta.type.map(async (type) => {
                    if (type.length > 0) {
                        return await this.type_has_menu.create({ type_id: type, menu_id: createMenu.id });
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
        const menu = await this.menu.findOne({
            where: {
                id: req.params.id
            }
        });
        const cooker = await this.cooker.findOne({
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
                const cooker = await this.cooker.findOne({
                    where: {
                        email: userAuth.data,
                    },
                });

                const menu = await this.menu.findOne({
                    where: {
                        id: req.params.id
                    },
                    include: [
                        {
                            model: this.type_has_menu,
                            include: [
                                {
                                    model: this.type
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

                const typeHasMenu = await this.type_has_menu.destroy({
                    where: {
                        menu_id: menu.id
                    }
                }, { transaction: t });
                meta.type.map(async (type) => {
                    if (type.length > 0) {
                        await this.type_has_menu.create({ type_id: type, menu_id: menu.id }, { transaction: t })
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
        const types = await this.type_has_menu.findAll({
            where: {
                menu_id: req.params.menuId
            },
            include: [
                {
                    model: this.type
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
            const menus = await this.menu.findAll({
                where: {
                    cooker_id: req.params.id
                },
                include: [
                    {
                        model: this.type_has_menu,
                        include: [
                            {
                                model: this.type
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

module.exports = menuController;
