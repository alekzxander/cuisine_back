const express = require('express');
const bodyParser = require('body-parser');
const index = require('./controller/routes/index');
const app = express();
const sequelize = require('./database/db');
const user = require('./controller/routes/user');
const cooker = require('./controller/routes/cooker');
const Cooker = require('./models/cooker');
const Menu = require('./models/menu');
const Transaction = require('./models/transaction');
const User = require('./models/user');
const Comment = require('./models/comment');
const Type_has_menu = require('./models/type_has_menu');
const Type = require('./models/type');
const path = require('path');
const Calendar = require('./models/calendar');

app.use(bodyParser.json({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    // res.header('Access-Control-Request-Headers', "Origin, X-Requested-With, Content-Type, Accept")
    next();
});
Menu.belongsTo(Cooker);
Menu.hasMany(Transaction);
Transaction.belongsTo(Menu);
User.hasMany(Transaction);
Transaction.belongsTo(User);
Cooker.hasMany(Menu);
Menu.hasMany(Comment, { onDelete: 'cascade', hooks: true });
User.hasMany(Comment, { onDelete: 'cascade', hooks: true });
Comment.belongsTo(User);
Comment.belongsTo(Menu);
Menu.hasMany(Type_has_menu);
Type_has_menu.belongsTo(Menu);
Type.hasMany(Type_has_menu);
Type_has_menu.belongsTo(Type);
Cooker.hasMany(Calendar);
Calendar.belongsTo(Cooker);

index(app);
user(app);
cooker(app, sequelize);


app.listen(3001);