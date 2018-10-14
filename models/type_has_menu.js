const sequelizeDb = require('../database/db');
const Sequelize = require('sequelize');

const type_has_menuModel = sequelizeDb.define('type_has_menu', {

    type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    menu_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

module.exports = type_has_menuModel;