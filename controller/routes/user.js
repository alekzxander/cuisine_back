const User = require('../../models/user');
const Comment = require('../../models/comment');
const Cooker = require('../../models/cooker');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const auth = require('../config/auth');

const user = (app) => {
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


    app.put('/profil-user/:id', auth.verifyToken, async (req, res) => {
        const userAuth = auth.checkToken(req.token);
        if (!userAuth) {
            res.status(401).json({ message: 'User not connected' })
        } else {
            const user = await User.findOne({
                where: {
                    email: userAuth.data,
                    id: req.params.id
                }
            });
            const updateUser = {
                last_name: req.body.lastname,
                first_name: req.body.firstname,
                adresse: req.body.adresse,
                phone: req.body.phone,
                picture: 'user.png'
            }
            const userUpdated = await user.update(updateUser);
            try {
                res.json({ userUpdated, type: 'user' })
            } catch (err) {
                res.json({ err })
            }
        }
    });
    app.post('/comment/:menu_id', async (req, res) => {
        // Recuperer l'id utilisateur avec le middleware du token
        const comment = {
            body: req.body.body,
            score: req.body.score,
            user_id: 2,
            menu_id: req.params.menu_id
        };
        const createComment = await Comment.create(comment);
        try {
            res.json({ createComment });
        } catch (err) {
            res.sendStatus(401);
        }
    })
};

module.exports = user;