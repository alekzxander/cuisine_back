const Menu = require('../models/menu');
const Cooker = require('../models/cooker');
const Date_booking = require('../models/date_booking');
const User = require('../models/user');
const Reservation = require('../models/reservation');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const dotEnv = require('dotenv');
const Email = require('./config/email');
dotEnv.config();


class authController {
    async login(req, res) {
        const logUser = await User.find({
            where: {
                email: req.body.email
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
        const logCooker = await Cooker.find({
            where: {
                email: req.body.email
            },
            include: [
                {
                    model: Date_booking
                },
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
                }
            ]
        });
        if (logCooker) {
            bcrypt.compare(req.body.password, logCooker.password, (err, pass) => {
                if (pass) {
                    const token = jwt.sign({ data: req.body.email }, process.env.SECRET_TOKEN);
                    res.json({ logCooker, token, type: 'cooker' });
                } else {
                    res.json({ type: 'error' });
                }
            });

        } else if (logUser) {
            bcrypt.compare(req.body.password, logUser.password, (err, pass) => {
                if (pass) {
                    const token = jwt.sign({ data: req.body.email }, 'secret');
                    res.json({ logUser, token, type: 'user' });
                } else {
                    res.json({ type: 'error' });
                }
            });
        } else {
            res.json({ type: 'error' })
        }
    };

}
module.exports = new authController();