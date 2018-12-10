
const auth = require('../config/auth');
const multer = require('multer');
const userController = require('../userController');
const reservationController = require('../reservationController');

const upload = multer({
    dest: 'public/images', // upload target directory
});

const user = (app) => {
    app.post('/user', userController.createUser);
    app.put('/user/:id', auth.verifyToken, upload.single('avatar'), userController.updateUser);
    app.post('/reservation/:menuId/:dateId', auth.verifyToken, reservationController.initReservation);
    app.get('/cancelPayment', reservationController.cancelPayment);
    app.get('/executePayment/:price', reservationController.executePayment);
};

module.exports = user;