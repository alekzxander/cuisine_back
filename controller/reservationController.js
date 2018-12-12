
const dotEnv = require('dotenv');
const moment = require('moment');
const paypal = require('paypal-rest-sdk');
const Reservation = require('../models/reservation');
const Email = require('./config/email');

dotEnv.config();
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

class reservationController {
    constructor(User, Cooker, Date_booking, Menu) {
        // console.log(Email, Reservation)
        this.user = User;
        this.cooker = Cooker;
        this.date_booking = Date_booking;
        this.menu = Menu;
        this.paypal = paypal;
        this.initReservation = this.initReservation.bind(this);
        this.cancelPayment = this.cancelPayment.bind(this);
        this.executePayment = this.executePayment.bind(this);
    }
    async initReservation(req, res) {
        // console.log(this.cooker, 'COOKER MODEL');
        // console.log(this.reservation, 'RESERVATION MODEL')
        const userAuth = req.token;
        try {
            guest = req.body.nbGuest;
            const findUser = await this.user.findOne({
                where: {
                    email: userAuth.data
                }
            });
            if (findUser) {
                userInstance = findUser;
                // Check user is not a cooker
                const findMenu = await this.menu.findOne({
                    where: {
                        id: req.body.menuId
                    }
                });
                menuInstance = findMenu;
                // get menu select by user
                const findCooker = await this.cooker.findOne({
                    where: {
                        id: findMenu.cooker_id
                    }
                });
                cookerInstance = findCooker;
                // check date is exist
                const date = await this.date_booking.compareDate(findCooker.id, req.body.dateId);
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
    };
    async cancelPayment(req, res) {
        res.render('cancel.ejs')
    };
    async executePayment(req, res) {
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
                // console.log(this.reservation, 'RESERVATION MODEL')
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
                res.redirect('http://localhost:3000');
            }
        });
    }
};

module.exports = reservationController;