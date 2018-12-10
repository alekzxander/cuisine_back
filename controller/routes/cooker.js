
const auth = require('../config/auth');
const multer = require('multer');
const cookerController = require('../cookerController');
const menuController = require('../menuController');
const upload = multer({
    dest: 'public/images', // upload target directory
});
const dotEnv = require('dotenv');
dotEnv.config();

const cooker = (app) => {

    app.post('/cooker', cookerController.createCooker);
    app.put('/cooker/:id', auth.verifyToken, upload.single('avatar'), cookerController.updateCooker);
    app.post('/menu', auth.verifyToken, upload.single('picture'), menuController.createMenu);
    app.delete('/menu/:id', auth.verifyToken, menuController.deleteMenu);
    app.put('/menu/:id', auth.verifyToken, upload.single('picture'), menuController.updateMenu);
    app.post('/date', auth.verifyToken, cookerController.updateDate);
    app.get('/menu_type/:menuId', menuController.getTypesByMenu);
    app.get('/menus_cooker/:id', menuController.menusByCooker);
}

module.exports = cooker;