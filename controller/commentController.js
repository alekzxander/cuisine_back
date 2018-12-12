


class commentController {
    constructor(Menu, User, Comment) {
        this.menu = Menu;
        this.user = User;
        this.comment = Comment;
        this.getComments = this.getComments.bind(this);
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
    }
};
module.exports = commentController;