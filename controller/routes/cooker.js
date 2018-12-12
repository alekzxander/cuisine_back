
const auth = require('../config/auth');
const multer = require('multer');
const cookerController = require('../cookerController');
const menuController = require('../menuController');

const Comment = require('../../models/comment');
const Menu = require('../../models/menu');
const User = require('../../models/user');
const Cooker = require('../../models/cooker');
const Date_booking = require('../../models/date_booking');
const Reservation = require('../../models/reservation');
const Type_has_menu = require('../../models/type_has_menu');
const Type = require('../../models/type');

const menus = new menuController(Menu, Cooker, User, Comment, Type_has_menu, Type, Date_booking);
const cookers = new cookerController(Menu, Cooker, Date_booking, User, Reservation);

const upload = multer({
    dest: 'public/images', // upload target directory
});
const dotEnv = require('dotenv');
dotEnv.config();

const cooker = (app) => {

    app.post('/cooker', cookers.createCooker);
    app.put('/cooker/:id', auth.verifyToken, upload.single('avatar'), cookers.updateCooker);
    app.post('/menu', auth.verifyToken, upload.single('picture'), menus.createMenu);
    app.delete('/menu/:id', auth.verifyToken, menus.deleteMenu);
    app.put('/menu/:id', auth.verifyToken, upload.single('picture'), menus.updateMenu);
    app.post('/date', auth.verifyToken, cookers.updateDate);
    app.get('/menu_type/:menuId', menus.getTypesByMenu);
    app.get('/menus_cooker/:id', menus.menusByCooker);
}

module.exports = cooker;