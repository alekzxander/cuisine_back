
const auth = require('../config/auth');
const multer = require('multer');
const userController = require('../userController');
const reservationController = require('../reservationController');
const User = require('../../models/user');
const Cooker = require('../../models/cooker');
const Date_booking = require('../../models/date_booking');
const Menu = require('../../models/menu');
const Email = require('../config/email');
const Reservation = require('../../models/reservation');
const commentControler = require('../commentController');
const Comment = require('../../models/comment');

const upload = multer({
    dest: 'public/images', // upload target directory
});

const reservations = new reservationController(User, Cooker, Date_booking, Menu);
const users = new userController(User, Reservation, Date_booking, Menu, Email);
const comments = new commentControler(Menu, User, Comment);
const user = (app) => {
    app.post('/user', users.createUser);
    app.put('/user/:id', auth.verifyToken, upload.single('avatar'), users.updateUser);
    app.post('/reservation', auth.verifyToken, reservations.initReservation);
    app.get('/cancelPayment', reservations.cancelPayment);
    app.get('/executePayment/:price', reservations.executePayment);
    app.post('/comments', auth.verifyToken, comments.addComment);
};

module.exports = user;