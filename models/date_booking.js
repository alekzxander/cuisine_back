const sequelizeDb = require('../database/db');
const Sequelize = require('sequelize');

const dateBookingModel = sequelizeDb.define('date_booking', {

    date: {
        type: Sequelize.DATE,
        allowNull: false,
        unique: true,
    },
    cooker_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    book: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
});

module.exports = dateBookingModel;