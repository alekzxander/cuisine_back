
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const dotEnv = require('dotenv');
const Email = require('./config/email');
dotEnv.config();


class authController {
    constructor(Menu, Cooker, Date_booking, Reservation, User) {
        this.menu = Menu;
        this.cooker = Cooker;
        this.date_booking = Date_booking;
        this.reservation = Reservation;
        this.user = User;
        this.login = this.login.bind(this);
    }
    async login(req, res) {
        const logUser = await this.user.find({
            where: {
                email: req.body.email
            },
            include: [
                {
                    model: this.reservation,
                    attributes: ['nb_guest', 'commented', 'id'],
                    include: [
                        {
                            model: this.date_booking,
                        },
                        {
                            model: this.menu
                        }
                    ]
                }
            ]
        });
        const logCooker = await this.cooker.find({
            where: {
                email: req.body.email
            },
            include: [
                {
                    model: this.date_booking
                },
                {
                    model: this.reservation,
                    include: [
                        {
                            model: this.user,
                        },
                        {
                            model: this.menu
                        },
                        {
                            model: this.date_booking
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
module.exports = authController;