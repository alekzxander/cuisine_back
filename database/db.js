const Sequelize = require('sequelize');
const dotEnv = require('dotenv');
dotEnv.config();
const { DATANAME, DATAPASS } = process.env;

const sequelize = new Sequelize('cuisinepouzot', DATANAME, DATAPASS, {
    host: 'localhost',
    dialect: 'mysql',
    operatorsAliases: false,
    port: 8889,
    define: {
        timestamps: false,
        freezeTableName: true,
        underscored: true
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = sequelize;