const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const { promisify } = require('util');
const dotEnv = require('dotenv');
dotEnv.config();
const { USER_MAIL, PASSWORD_MAIL } = process.env;
const renderFile = promisify(ejs.renderFile).bind(ejs);

const smtpConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: USER_MAIL,
        pass: PASSWORD_MAIL,
    }
};

const transporter = nodemailer.createTransport(smtpConfig);

transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log(`Mail Server is ready to handle messages (success :${success})`);
    }
});

const mailer = {

    transporter,

    async sendSuccessRegister(firstname, lastname) {
        try {
            const res = await renderFile(
                path.join(__dirname, 'email_templates', 'registerSuccess.ejs'),
                { firstname, lastname },
            );
            return res;
        } catch (error) {
            console.log(error)
            return false;
        }
    },

    async reservationUser(userName, date, guest, cookerName, title, price, start, dish, dessert) {
        try {
            const res = await renderFile(
                path.join(__dirname, 'email_templates', 'reservationUser.ejs'),
                { userName, date, guest, cookerName, title, price, start, dish, dessert },
            );
            return res;
        }
        catch (error) {
            console.log(error)
            return false;
        }
    },
    async reservationCooker(cookerName, date, title, guest, phone, adresse) {
        try {
            const res = await renderFile(
                path.join(__dirname, 'email_templates', 'reservationCooker.ejs'),
                { cookerName, date, title, guest, phone, adresse },
            );
            return res;
        } catch (error) {
            console.log(error)
            return false;
        }
    },
    async registerCooker(cookerName) {
        try {
            const res = await renderFile(
                path.join(__dirname, 'email_templates', 'registerCooker.ejs'),
                { cookerName }
            );
            return res
        } catch (error) {
            console.log(error);
            return false;
        }
    }

}
module.exports = mailer;