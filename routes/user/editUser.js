'use strict';
'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Bcrypt = require('bcrypt-nodejs');
const User = require('../../models/User');

module.exports = {
    method: 'PATCH',
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
            payload: Joi.object({
                permissions: Joi.object({
                    is_admin: Joi.bool().optional(),
                    can_upload: Joi.bool().optional(),
                    can_delete_own: Joi.bool().optional()
                }).optional(),
                name: Joi.string().optional(),
                username: Joi.string().optional(),
                password: Joi.string()
                    .min(8)
                    .optional(),
                deleted_at: Joi.date().optional()
            }),
            headers: Joi.object({}).options({ allowUnknown: true })
        }
    },
    async handler(req, h) {
        const user_id = req.params.userID;
        const req_user = req.auth.credentials;
        try {
            var user_result = await User.findById(user_id);
            console.log(user_result);
        } catch (err) {
            return Boom.internal(
                'Internal error: Finding user with ID' + user_id
            );
        }
        if (user_result == false) {
            return Boom.notFound('There was no user found for this ID.');
        }
        if (!req_user.permissions.is_admin && req_user._id != user_result._id) {
            return Boom.unauthorized(
                'Non-admins can only update their own user.'
            );
        }

        if (req.payload.password) {
            const salt = Bcrypt.genSaltSync(10);
            req.payload.password_hash = Bcrypt.hashSync(
                req.payload.password,
                salt
            );
            console.log(
                'New password: ',
                req.payload.password,
                '=>',
                req.payload.password_hash
            );
            delete req.payload.password;
        }

        if (req.payload.permissions && !req_user.permissions.is_admin) {
            // Don't allow privelege escalation
            throw Boom.forbidden(
                'You do not have the rights to edit permissions for this user'
            );
        }

        console.log('Before update');
        console.log(req.payload);
        await user_result.update(req.payload);
        user_result.save();
        console.log('After update');
        return true;
    } // End handler
}; // End route
