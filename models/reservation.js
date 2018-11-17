const sequelizeDb = require('../database/db');
const Sequelize = require('sequelize');

const transactionModel = sequelizeDb.define('reservation', {
    nb_guest: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    date_id: {
        type: Sequelize.DATE,
        allowNull: false,
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    menu_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
    }
});

module.exports = transactionModel;