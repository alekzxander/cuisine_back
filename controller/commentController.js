const Comment = require('../models/comment');
const Menu = require('../models/menu');
const User = require('../models/user');


class commentController {
    async getComments(req, res) {
        const comments = await Comment.findAll({
            include: [
                {
                    model: Menu
                },
                {
                    model: User,
                    attributes: [
                        'first_name',
                        'last_name',
                        'picture',
                        'id'
                    ]
                }
            ],
            order: [['id', 'DESC']]
        });
        try {
            res.json({ comments });
        } catch (err) {
            res.sendStatus(401);
        }
    }
};
module.exports = new commentController();