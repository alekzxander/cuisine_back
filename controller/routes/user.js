const User = require('../../models/user');
const Comment = require('../../models/comment');
const Cooker = require('../../models/cooker');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const auth = require('../config/auth');
const multer = require('multer');
const fs = require('fs');

const upload = multer({
    dest: 'public/images', // upload target directory
});

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
                }
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
    });
    app.post('/get-image', upload.single('img'), async (req, res) => {
        res.json({ resp: req.file })
    });
};

module.exports = user;