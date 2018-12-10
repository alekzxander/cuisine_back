const User = require('../models/user');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Reservation = require('../models/reservation');
const fs = require('fs');
const Date_booking = require('../models/date_booking');
const Menu = require('../models/menu');
const Email = require('./config/email');
const paypal = require('paypal-rest-sdk');
const dotEnv = require('dotenv');
dotEnv.config();
class userController {
    async createUser(req, res) {
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
    };
    async updateUser(req, res) {
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
    }
};
module.exports = new userController()