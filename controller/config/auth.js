


exports.verifyToken = function (req, res, next) {
    console.log(req.headers['authorization'], 'autorization header')
    const bearerHeader = req.headers['authorization'];
    if (bearerHeader) {
        req.token = bearerHeader;
        next();
    } else {
        res.sendStatus(401)
    }
}
exports.checkToken = function (token) {
    return jwt.verify(token, 'secret');
}

