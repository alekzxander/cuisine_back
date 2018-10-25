const Menu = require('../../models/menu');
const Cooker = require('../../models/cooker');
const Calendar = require('../../models/calendar');
const User = require('../../models/user');
const Transaction = require('../../models/transaction');
const Comment = require('../../models/comment');
const Type_has_menu = require('../../models/type_has_menu');
const Type = require('../../models/type');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const index = (app) => {

    app.post('/login', async (req, res) => {
        const logUser = await User.find({
            where: {
                email: req.body.email
            }
        });
        const logCooker = await Cooker.find({
            where: {
                email: req.body.email
            }
        });

        if (logCooker) {
            console.log('in cooker')
            bcrypt.compare(req.body.password, logCooker.password, (err, pass) => {
                if (pass) {
                    const token = jwt.sign({ data: req.body.email, exp: Math.floor(Date.now() / 1000) + (60 * 60) }, 'secret');
                    res.json({ logCooker, token, type: 'cooker' });
                } else {
                    res.json({ message: 'Error password or email' });
                }
            });

        } else if (logUser) {
            console.log('in cooker')
            bcrypt.compare(req.body.password, logUser.password, (err, pass) => {
                if (pass) {
                    const token = jwt.sign({ data: req.body.email, exp: Math.floor(Date.now() / 1000) + (60 * 60) }, 'secret');
                    res.json({ logUser, token, type: 'user' });
                } else {
                    res.json({ message: 'Error password or email' });
                }
            });
        } else {
            res.json({ message: 'Error password or email' })
        }
    });

    // app.get('/menus', async (req, res) => {
    //     const menus = await Menu.findAll({
    //         where: {
    //             draft: false
    //         },
    //         include: [
    //             {
    //                 model: Cooker,
    //                 attributes: ['last_name', 'first_name', 'id'],
    //             },
    //             {
    //                 model: Type_has_menu,
    //                 include: [
    //                     {
    //                         model: Type
    //                     }
    //                 ]
    //             }

    //         ],
    //         order: [['id', 'DESC']]
    //     });
    //     try {
    //         res.json({ menus });
    //     } catch (err) {
    //         res.sendStatus(401);
    //     }
    // });
    app.get('/menu/:id', async (req, res) => {
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
        const calendar = await Calendar.findAll({
            where: {
                cooker_id: menu.cooker_id
            }
        });
        try {
            res.json({ menu });
        } catch (err) {
            res.sendStatus(401);
        }
    });
    app.get('/profil-user/:id', async (req, res) => {
        /// condition pour accéder à cette page avec un middleware
        /// verification que l'id correspond bien à celle de l'utilisateur connecté
        const user = await User.findOne({
            where: {
                id: req.params.id
            },
            include: [
                {
                    model: Transaction,
                    include: [
                        {
                            model: Menu
                        }
                    ]
                }
            ]
        });
        try {
            res.json({ user });
        } catch (err) {
            res.sendStatus(401);
        }
    });
    app.get('/profil-cooker/:id', async (req, res) => {
        const cooker = await Cooker.findOne({
            where: {
                id: req.params.id
            },
            include: [
                {
                    model: Menu
                }
            ]
        });
        try {
            res.json({ cooker });
        } catch (err) {
            res.sendStatus(401);
        }
    });
    app.get('/comments', async (req, res) => {
        const comments = await Comment.findAll({
            include: [
                {
                    model: Menu
                },
                {
                    model: User,
                    attributes: [
                        'first_name',
                        'last_name',
                        'picture',
                        'id'
                    ]
                }
            ],
            order: [['id', 'DESC']]
        });
        try {
            res.json({ comments });
        } catch (err) {
            res.sendStatus(401);
        }
    });
    app.get('/types', async (req, res) => {
        const types = await Type.findAll({});

        res.json({ types })
    });
    app.get('/menus_chef/:chefId', async (req, res) => {
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
        })
    });
    app.get('/menus/:type?', async (req, res) => {
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
            console.log(req.query.type)
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
    })
    app.get('/image/:model/:id', async (req, res) => {
        if (req.params.model === 'Cooker') {
            const cooker = await Cooker.findOne({
                where: {
                    id: req.params.id
                }
            });
            fs.readFile(`public/images/${cooker.picture}`, function (err, data) {
                if (err) {
                    return console.log(err);
                }
                res.contentType('image/png');
                res.end(data, 'binary');
            });
        } else if (req.params.model === 'User') {
            const user = await User.findOne({
                where: {
                    id: req.params.id
                }
            });
            fs.readFile(`public/images/${user.picture}`, function (err, data) {
                if (err) {
                    return console.log(err);
                }
                res.contentType('image/png');
                res.end(data, 'binary');
            });
        } else {
            const menu = await Menu.findOne({
                where: {
                    id: req.params.id
                }

            });
            fs.readFile(`public/images/${menu.picture}`, function (err, data) {
                if (err) {
                    return console.log(err);
                }
                res.contentType('image/png');
                res.end(data, 'binary');
            })
        }

    });

};

module.exports = index;