
const menuController = require('../menuController');
const commentController = require('../commentController');
const authController = require('../authController');

const Comment = require('../../models/comment');
const Menu = require('../../models/menu');
const User = require('../../models/user');

const comment = new commentController(Menu, User);
const index = (app) => {
    app.post('/login', authController.login);
    app.get('/menu/:id', menuController.getMenu);
    app.get('/comments', comment.getComments);
    app.get('/types', menuController.getTypes);
    app.get('/menus_chef/:chefId', menuController.menuChef);
    app.get('/menus/:type?', menuController.getMenus)
    app.get('/image/:model/:id', menuController.getImages);

};

module.exports = index;