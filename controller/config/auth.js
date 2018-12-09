
const jwt = require('jsonwebtoken');
const dotEnv = require('dotenv');
dotEnv.config();
exports.verifyToken = function (req, res, next) {
    const bearerHeader = req.headers['authorization'];
    const token = jwt.verify(bearerHeader, process.env.SECRET_TOKEN);
    if (token) {
        req.token = token;
        next();
    } else {
        res.sendStatus(401);
    }
}
