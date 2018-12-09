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
dateBookingModel.compareDate = async function (idCooker, idDate) {
    const findDate = await this.findAll({
        where: {
            cooker_id: idCooker,
            book: false
        },
    });
    // get all date from cooker not book
    const dateBooking = await this.findOne({
        where: {
            id: idDate
        },
    });
    dateInstance = dateBooking;
    let datesId = [];
    findDate.forEach((date) => {
        datesId.push(date.id)
    });
    // Get date select by user
    // console.log(datesId.includes(dateBooking.id) ? dateBooking : null)
    return datesId.includes(dateBooking.id) ? dateBooking : null;

}
module.exports = dateBookingModel;