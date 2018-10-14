const sequelizeDb = require('../database/db');
const Sequelize = require('sequelize');

const menuModel = sequelizeDb.define('menu', {

    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    draft: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    start: {
        type: Sequelize.STRING,
        allowNull: false
    },
    dish: {
        type: Sequelize.STRING,
        allowNull: false
    },
    dessert: {
        type: Sequelize.STRING,
        allowNull: false
    },
    picture: {
        type: Sequelize.STRING,
        allowNull: false
    },
    nb_guest: {
        type: Sequelize.STRING,
        allowNull: false
    },
    price: {
        type: Sequelize.STRING,
        allowNull: false
    },
    cooker_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

module.exports = menuModel;