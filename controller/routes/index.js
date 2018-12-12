
const menuController = require('../menuController');
const commentController = require('../commentController');
const authController = require('../authController');

const Comment = require('../../models/comment');
const Menu = require('../../models/menu');
const User = require('../../models/user');
const Cooker = require('../../models/cooker');
const Date_booking = require('../../models/date_booking');
const Reservation = require('../../models/reservation');
const Type_has_menu = require('../../models/type_has_menu');
const Type = require('../../models/type');

const comments = new commentController(Menu, User, Comment);
const authenticate = new authController(Menu, Cooker, Date_booking, Reservation, User);
const menus = new menuController(Menu, Cooker, User, Comment, Type_has_menu, Type, Date_booking);

const index = (app) => {
    app.post('/login', authenticate.login);
    app.get('/menu/:id', menus.getMenu);
    app.get('/comments', comments.getComments);
    app.get('/types', menus.getTypes);
    app.get('/menus_chef/:chefId', menus.menuChef);
    app.get('/menus/:type?', menus.getMenus)
    app.get('/image/:model/:id', menus.getImages);
};

module.exports = index;