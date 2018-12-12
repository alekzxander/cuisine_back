
const sequelize = require('../database/db');

class commentController {
    constructor(Menu, User, Comment, Reservation) {
        this.menu = Menu;
        this.user = User;
        this.comment = Comment;
        this.reservation = Reservation;
        this.getComments = this.getComments.bind(this);
        this.addComment = this.addComment.bind(this);
    }
    async getComments(req, res) {
        const comments = await this.comment.findAll({
            include: [
                {
                    model: this.menu
                },
                {
                    model: this.user,
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
    };
    async addComment(req, res) {
        console.log('COUCOU')
        const userAuth = req.token;
        sequelize.transaction().then(async t => {
            try {
                const findUser = await this.user.findOne({
                    where: {
                        email: userAuth.data
                    }
                }, { transaction: t });
                const comment = {
                    body: req.body.comment,
                    score: req.body.note,
                    user_id: findUser.id,
                    menu_id: req.body.menuId
                };
                const createComment = await this.comment.create(comment, { transaction: t });
                await this.reservation.update(
                    {
                        commented: true
                    },
                    {
                        where: {
                            id: req.body.reservationId
                        }
                    }, { transaction: t });
                t.commit();
                res.json({ createComment });
            } catch (err) {
                t.rollback(err);
                res.status(300);
            }
        });
    }
};
module.exports = commentController;