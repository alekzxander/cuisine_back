const Menu = require('../models/menu');
const Cooker = require('../models/cooker');
const Date_booking = require('../models/date_booking');
const User = require('../models/user');
const Reservation = require('../models/reservation');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const dotEnv = require('dotenv');
const Email = require('./config/email');
const sequelize = require('../database/db');
dotEnv.config();


class cookerController {
    async createCooker(req, res) {
        const verifyCooker = await Cooker.findOne({
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
            const token = jwt.sign({ data: req.body.email }, process.env.SECRET_TOKEN);
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
    };
    async updateCooker(req, res) {
        const fileToUpload = req.file;
        const userAuth = req.token;
        const meta = JSON.parse(req.body.data);
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
    };
    updateDate(req, res) {
        const userAuth = req.token;
        sequelize.transaction().then(async t => {
            try {
                const cooker = await Cooker.findOne({
                    where: {
                        email: userAuth.data
                    }
                });

                const booking = await Date_booking.destroy({
                    where: {
                        cooker_id: cooker.id,
                        book: false
                    }
                }, { transaction: t });

                const dateBook = req.body.date.map((date) => {
                    return {
                        date,
                        cooker_id: cooker.id,
                        book: false,
                    }
                });
                const dates = await Date_booking.bulkCreate(dateBook, { transaction: t });
                await t.commit();
                res.status(200).json({ dates });
            } catch (err) {
                res.sendStatus(401);
                await t.rollback();
            }
        });
    };
}
module.exports = new cookerController();