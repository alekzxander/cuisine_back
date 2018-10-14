const sequelizeDb = require('../database/db');
const Sequelize = require('sequelize');

const calendarModel = sequelizeDb.define('calendar', {

    date: {
        type: Sequelize.DATE,
        allowNull: false,
        unique: true,
    },
    cooker_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

module.exports = calendarModel;