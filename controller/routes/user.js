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
const upload = multer({
    dest: 'public/images', // upload target directory
});

const user = (app, sequelize) => {
    app.post('/profil-user', async (req, res) => {
        const verifyUser = await User.find({
            where: {
                email: req.body.email
            }
        });
        if (!verifyUser) {
            const password = User.generateHash(req.body.password);
            const user = {
                last_name: req.body.lastname,
                first_name: req.body.firstname,
                password,
                email: req.body.email,
                adresse: req.body.adresse,
                phone: req.body.phone,
                picture: 'user.png'
            };

            const logUser = await User.create(user);
            const token = jwt.sign({ data: req.body.email, exp: Math.floor(Date.now() / 1000) + (60 * 60) }, 'secret');
            try {
                res.json({ logUser, token, type: 'user' })
            } catch (err) {
                res.json({ err })
            }
        } else {
            console.log('USER EXIST')
            res.json({ message: 'user already exist' })
        }

    });


    app.put('/profil-user/:id', auth.verifyToken, upload.single('avatar'), async (req, res) => {
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
                imgOrigin = 'user.png';
            }
            console.log(imgOrigin)
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
    });
    app.post('/comment/:menu_id/:reservation_id', auth.verifyToken, async (req, res) => {
        const userAuth = auth.checkToken(req.token);
        if (!userAuth) {
            res.status(401).json({ message: 'User not connected' })
        } else {
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
        }
    });
    app.get('/date/:id', async (req, res) => {
        const date = await Date_booking.findOne({
            where: {
                id: req.params.id
            }
        });
        res.json({ booking: date })
    })
    app.post('/reservation/:menuId/:dateId', auth.verifyToken, async (req, res) => {
        const userAuth = auth.checkToken(req.token);
        if (!userAuth) {
            res.status(401).json({ message: 'User not connected' })
        } else {
            sequelize.transaction().then(async t => {
                try {
                    const findUser = await User.findOne({
                        where: {
                            email: userAuth.data
                        }
                    }, { transaction: t });
                    if (findUser) {
                        // Check user is not a cooker
                        const findMenu = await Menu.findOne({
                            where: {
                                id: req.params.menuId
                            }
                        }, { transaction: t });
                        // get menu select by user
                        const findCooker = await Cooker.findOne({
                            where: {
                                id: findMenu.cooker_id
                            }
                        }, { transaction: t });
                        // Get cooker by menu id
                        const findDate = await Date_booking.findAll({
                            where: {
                                cooker_id: findCooker.id,
                                book: false
                            },
                        }, { transaction: t });
                        // get all date from cooker not book
                        const dateBooking = await Date_booking.findOne({
                            where: {
                                id: req.params.dateId
                            },
                        }, { transaction: t });
                        let datesId = [];
                        findDate.forEach((date) => {
                            datesId.push(date.id)
                        });
                        console.log(datesId, dateBooking)
                        // Get date select by user
                        const compareDate = datesId.includes(dateBooking.id);
                        // check date is exist
                        if (compareDate) {
                            // if date exist update date for render booking
                            await dateBooking.update({ book: true }, { transaction: t });
                            const reservation = {
                                nb_guest: req.body.nbGuest,
                                date_booking_id: dateBooking.id,
                                user_id: findUser.id,
                                menu_id: findMenu.id,
                                commented: false
                            }
                            const createReservation = await Reservation.create(reservation, { transaction: t });

                            res.status(200).json({ reservation: createReservation })
                        } else {
                            console.log('Error date')
                            res.status(300).json({ message: 'Date unavailable' })
                        }
                        t.commit();
                    } else {
                        res.status(401).json({ message: 'Cooker cannot book menu' })
                    }
                } catch (err) {
                    t.rollback();
                    console.log(err)
                    res.status(300);
                }
            });
        }
    });
};

module.exports = user;