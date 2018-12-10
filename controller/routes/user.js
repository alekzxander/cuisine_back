const User = require('../../models/user');
const Comment = require('../../models/comment');
const Cooker = require('../../models/cooker');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const auth = require('../config/auth');
const multer = require('multer');
const Reservation = require('../../models/reservation');
const fs = require('fs');
const Date_booking = require('../../models/date_booking');
const Menu = require('../../models/menu');
const Email = require('../config/email');
const moment = require('moment');
const paypal = require('paypal-rest-sdk');
const dotEnv = require('dotenv');
dotEnv.config();
const upload = multer({
    dest: 'public/images', // upload target directory
});

const user = (app, sequelize) => {
    app.get('/meuh', async (req, res) => {
        // console.log(await User.findAllDate(1))
    })
    app.post('/user', async (req, res) => {
        const verifyUser = await User.find({
            where: {
                email: req.body.email
            }
        });
        if (!verifyUser) {
            const password = User.generateHash(req.body.password);
            const userInstance = {
                last_name: req.body.lastname,
                first_name: req.body.firstname,
                password,
                email: req.body.email,
                adresse: req.body.adresse,
                phone: req.body.phone,
                picture: 'user.png'
            };

            const user = await User.create(userInstance);
            const logUser = await User.findOne({
                where: {
                    id: user.id
                }, include: [
                    {
                        model: Reservation,
                        attributes: ['nb_guest', 'commented', 'id'],
                        include: [
                            {
                                model: Date_booking,
                            },
                            {
                                model: Menu
                            }
                        ]
                    }
                ]
            });
            const token = jwt.sign({ data: req.body.email }, process.env.SECRET_TOKEN);
            const mailContent = await Email.sendSuccessRegister(
                req.body.firstname,
                req.body.lastname,
            );
            const mailOptions = {
                from: '"Cuizine Pou Zot" alekz.contact.webdev@gmail.com',
                to: req.body.email,
                subject: 'Inscription chez Cuizine Pou Zot', // Subject line
                html: mailContent,
            };
            Email.transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                }
            });
            res.json({ logUser, token, type: 'user', message: `Votre inscription à était enregistrer avec succes, vous pouvez désormais avoir accés à votre profil !` });
        } else {
            res.json({ message: 'Désolé mais ce compte existe déjà' })
        }
    });


    app.put('/user/:id', auth.verifyToken, upload.single('avatar'), async (req, res) => {
        const fileToUpload = req.file;
        const userAuth = req.token;
        const meta = JSON.parse(req.body.data);
        let targetPath;
        let tmpPath;
        let imgOrigin;
        const user = await User.findOne({
            where: {
                email: userAuth.data,
                id: req.params.id
            },
            include: [
                {
                    model: Reservation,
                    attributes: ['nb_guest', 'commented', 'id'],
                    include: [
                        {
                            model: Date_booking,
                        },
                        {
                            model: Menu
                        }
                    ]
                }
            ]
        });
        if (fileToUpload) {
            const extension = fileToUpload.mimetype.split('/');
            targetPath = `public/images/${fileToUpload.filename}.${extension[1]}`;
            tmpPath = fileToUpload.path;
            imgOrigin = `${fileToUpload.filename}.${extension[1]}`;
        } else {
            imgOrigin = user.picture;
        }
        const updateUser = {
            last_name: meta.lastname,
            first_name: meta.firstname,
            adresse: meta.adresse,
            phone: meta.phone,
            picture: imgOrigin
        }
        const userUpdated = await user.update(updateUser);
        if (fileToUpload) {
            const src = fs.createReadStream(tmpPath);
            const dest = fs.createWriteStream(targetPath);
            src.pipe(dest);
            fs.unlink(tmpPath);
        }
        try {
            res.json({ userUpdated, type: 'user' })
        } catch (err) {
            res.json({ err })
        }
    });
    app.post('/comment/:menu_id/:reservation_id', auth.verifyToken, async (req, res) => {
        const userAuth = req.token;
        sequelize.transaction().then(async t => {
            try {
                const findUser = await User.findOne({
                    where: {
                        email: userAuth.data
                    }
                }, { transaction: t });
                const comment = {
                    body: req.body.comment,
                    score: req.body.note,
                    user_id: findUser.id,
                    menu_id: req.params.menu_id
                };
                const createComment = await Comment.create(comment, { transaction: t });
                await Reservation.update(
                    {
                        commented: true
                    },
                    {
                        where: {
                            id: req.params.reservation_id
                        }
                    }, { transaction: t });
                t.commit();
                res.json({ createComment });
            } catch (err) {
                t.rollback();
                console.log(err)
                res.status(300);
            }
        });
    });
    app.get('/date/:id', async (req, res) => {
        const date = await Date_booking.findOne({
            where: {
                id: req.params.id
            }
        });
        res.json({ booking: date })
    })
    paypal.configure({
        'mode': 'sandbox', //sandbox or live
        'client_id': process.env.CLIENT_ID,
        'client_secret': process.env.CLIENT_SECRET
    });

    let userInstance;
    let dateInstance;
    let cookerInstance;
    let menuInstance;
    let guest;
    app.post('/reservation/:menuId/:dateId', auth.verifyToken, async (req, res) => {
        const userAuth = req.token;
        try {
            guest = req.body.nbGuest;
            const findUser = await User.findOne({
                where: {
                    email: userAuth.data
                }
            });
            if (findUser) {
                userInstance = findUser;
                // Check user is not a cooker
                const findMenu = await Menu.findOne({
                    where: {
                        id: req.params.menuId
                    }
                });
                menuInstance = findMenu;
                // get menu select by user
                const findCooker = await Cooker.findOne({
                    where: {
                        id: findMenu.cooker_id
                    }
                });
                cookerInstance = findCooker;
                // check date is exist
                const date = await Date_booking.compareDate(findCooker.id, req.params.dateId);
                dateInstance = date;
                if (date) {
                    // if date exist update date for render booking
                    const totalPrice = findMenu.price * req.body.nbGuest;
                    const create_payment_json = {
                        "intent": "sale",
                        "payer": {
                            "payment_method": "paypal"
                        },
                        "redirect_urls": {
                            "return_url": `${process.env.HOSTNAME}/executePayment/${totalPrice}`,
                            "cancel_url": `${process.env.HOSTNAME}/cancelPayment`
                        },
                        "transactions": [{
                            "item_list": {
                                "items": [{
                                    "name": "item",
                                    "sku": "item",
                                    "price": findMenu.price,
                                    "currency": "EUR",
                                    "quantity": req.body.nbGuest
                                }]
                            },
                            "amount": {
                                "currency": "EUR",
                                "total": totalPrice
                            },
                            "description": "This is the payment description."
                        }]
                    };
                    paypal.payment.create(create_payment_json, function (error, payment) {
                        if (error) {
                            throw error;
                        } else {
                            res.json({ payment })
                        }
                    });
                } else {
                    res.status(300).json({ message: 'Date unavailable' })
                }

            } else {
                res.status(401).json({ message: 'Cooker cannot book menu' })
            }
        } catch (err) {
            res.status(300);
        }
    });

    app.get('/cancelPayment', (req, res) => {
        res.render('cancel.ejs')
    });
    app.get('/executePayment/:price', (req, res) => {
        const paymentId = req.query.paymentId;
        const payer_id = req.query.PayerID;
        const execute_payment_json = {
            "payer_id": payer_id,
            "transactions": [{
                "amount": {
                    "currency": "EUR",
                    "total": req.params.price
                }
            }]
        };

        paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
            if (error) {
                throw error;
            } else {
                const reservation = {
                    nb_guest: guest,
                    date_booking_id: dateInstance.id,
                    user_id: userInstance.id,
                    menu_id: menuInstance.id,
                    commented: false,
                    cooker_id: cookerInstance.id
                };
                const createReservation = await Reservation.create(reservation);
                await dateInstance.update({ book: true });
                const date = moment(dateInstance.date).format('DD-MM-YYYY');
                const mailContentUser = await Email.reservationUser(
                    userInstance.first_name,
                    date,
                    guest,
                    userInstance.first_name,
                    menuInstance.title,
                    req.params.price,
                    menuInstance.start,
                    menuInstance.dish,
                    menuInstance.dessert
                );
                const mailContentCooker = await Email.reservationCooker(
                    cookerInstance.first_name,
                    date,
                    menuInstance.title,
                    guest,
                    userInstance.phone,
                    userInstance.adresse
                );
                const mailOptionsCooker = {
                    from: '"Cuizine Pou Zot" alekz.contact.webdev@gmail.com', // sender address
                    to: cookerInstance.email, // list of receivers
                    subject: `Reservation du menu ${menuInstance.title}`, // Subject line
                    html: mailContentCooker,
                };
                const mailOptionsUser = {
                    from: '"Cuizine Pou Zot" alekz.contact.webdev@gmail.com', // sender address
                    to: userInstance.email, // list of receivers
                    subject: `Reservation du menu ${menuInstance.title}`, // Subject line
                    html: mailContentUser,
                };
                Email.transporter.sendMail(mailOptionsUser, (error, info) => {
                    if (error) {
                        console.log(error, 'ERROR MAIL NOT SEND')
                    }
                    console.log(info, 'INFO MAIL TO SEND')
                });
                Email.transporter.sendMail(mailOptionsCooker, (error, info) => {
                    if (error) {
                        console.log(error, 'ERROR MAIL NOT SEND')
                    }
                    console.log(info, 'INFO MAIL TO SEND')
                });
                // res.status(200).json({ reservation: createReservation })
                console.log("Get Payment Response");
                console.log(JSON.stringify(payment));
                res.redirect('http://localhost:3000');
            }
        });
    });

};

module.exports = user;