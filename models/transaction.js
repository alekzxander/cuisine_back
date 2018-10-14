const sequelizeDb = require('../database/db');
const Sequelize = require('sequelize');

const transactionModel = sequelizeDb.define('transactions', {

    total_price: {
        type: Sequelize.STRING,
        allowNull: false
    },
    date: {
        type: Sequelize.DATE,
        allowNull: false
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    menu_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

module.exports = transactionModel;