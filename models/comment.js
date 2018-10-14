const sequelizeDb = require('../database/db');
const Sequelize = require('sequelize');

const commentModel = sequelizeDb.define('comment', {

    body: {
        type: Sequelize.STRING,
        allowNull: false
    },
    score: {
        type: Sequelize.STRING,
        allowNull: false
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    menu_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

module.exports = commentModel;

