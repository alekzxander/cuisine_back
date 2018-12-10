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
sequelize.authenticate().then(() => {
    console.log("Connection has been established successfully.");
})
    .catch(err => {
        console.error("Unable to connect to the database:", err);
    });

module.exports = sequelize;