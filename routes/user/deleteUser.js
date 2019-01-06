'use strict';
'use strict';
const Boom = require('boom');
const Joi = require('joi');
const User = require('../../models/User');

module.exports = {
    method: 'DELETE',
    path: '/{userID}',
    options: {
        tags: ['api', 'user'],
        validate: {
            params: {
                userID: Joi.string()
                    .length(24)
                    .alphanum()
                    .lowercase()
                    .required()
            },
            headers: Joi.object({}).options({ allowUnknown: true })
        }
    },
    async handler(req, h) {
        const user_id = req.params.userID;
        const req_user = req.auth.credentials;
        console.log('Start');
        try {
            var user_result = await User.findById(user_id);
            console.log(user_result);
        } catch (err) {
            return Boom.internal(
                'Internal error: Finding user with ID' + user_id
            );
        }
        console.log(user_result);
        if (user_result == false) {
            return Boom.notFound('There was no user found with that ID.');
        }
        if (!req_user.permissions.is_admin) {
            return Boom.forbidden('Only admins can delete users.');
        }
        if (user_result.deletedAt) {
            return Boom.resourceGone('This user has been deleted.');
        }
        user_result.deletedAt = new Date();
        user_result.save();
        return true;
    } // End handler
}; // End route
