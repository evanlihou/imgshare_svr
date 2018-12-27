'use strict';
const Boom = require('boom');
const Joi = require('joi');
const User = require('../../models/User');

const responseSchema = Joi.object({
    count: Joi.number(),
    prepared: Joi.date(),
    users: Joi.array().items(
        Joi.object({
            created_at: Joi.date(),
            expires_at: Joi.date().optional(),
            created_by: Joi.string(),
            is_private: Joi.boolean(),
            is_deleted: Joi.boolean(),
            img_id: Joi.string(),
            user: Joi.object({
                username: Joi.string()
            })
        })
    )
});

module.exports = {
    method: 'GET',
    path: '/',
    options: {
        tags: ['api', 'user'],
        description: 'Get all users',
        validate: {
            headers: Joi.object({
                all: Joi.bool()
                    .optional()
                    .description(
                        'Whether to display all users, including deleted.'
                    )
            }).options({ allowUnknown: true })
        }
        //response: {schema: responseSchema}
    },
    async handler(req) {
        const req_user = req.auth.credentials;
        if (!req_user.permissions.is_admin) {
            return Boom.unauthorized('Insufficient permissions');
        }
        let match = {};
        if (req.headers.all) {
            // The wonderful and clear syntax for getting everything
            match = {};
        } else {
            match = {
                deleted_at: null
            };
        }
        const users = await User.find(match);

        const response = {
            count: users.length,
            prepared: new Date(),
            users: users
        };
        return response;
    } // End handler
}; // End route
