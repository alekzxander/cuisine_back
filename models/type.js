const sequelizeDb = require('../database/db');
const Sequelize = require('sequelize');

const typeModel = sequelizeDb.define('type', {

    name: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = typeModel;