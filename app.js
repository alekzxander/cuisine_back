const express = require('express');
const bodyParser = require('body-parser');
const index = require('./controller/routes/index');
const app = express();
const sequelize = require('./database/db');
const user = require('./controller/routes/user');
const cooker = require('./controller/routes/cooker');
const Cooker = require('./models/cooker');
const Menu = require('./models/menu');
const Reservation = require('./models/reservation');
const User = require('./models/user');
const Comment = require('./models/comment');
const Type_has_menu = require('./models/type_has_menu');
const Type = require('./models/type');
const path = require('path');
const Date_booking = require('./models/date_booking');

app.use(bodyParser.json({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
Menu.belongsTo(Cooker);
Menu.hasMany(Reservation);
Reservation.belongsTo(Menu);
Reservation.belongsTo(Date_booking);
User.hasMany(Reservation);
Date_booking.hasMany(Reservation)
Reservation.belongsTo(User);
Cooker.hasMany(Reservation);
Reservation.belongsTo(Cooker);
Cooker.hasMany(Menu);
Menu.hasMany(Comment, { onDelete: 'cascade', hooks: true });
User.hasMany(Comment, { onDelete: 'cascade', hooks: true });
Comment.belongsTo(User);
Comment.belongsTo(Menu);
Menu.hasMany(Type_has_menu);
Type_has_menu.belongsTo(Menu);
Type.hasMany(Type_has_menu);
Type_has_menu.belongsTo(Type);
Cooker.hasMany(Date_booking);
Date_booking.belongsTo(Cooker);
index(app);
user(app, sequelize);
cooker(app, sequelize);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.listen(3001);