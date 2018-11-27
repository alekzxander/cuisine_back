const sequelizeDb = require('../database/db');
const Sequelize = require('sequelize');

const transactionModel = sequelizeDb.define('reservation', {
    nb_guest: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    date_booking_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    cooker_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    menu_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    commented: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
});

module.exports = transactionModel;