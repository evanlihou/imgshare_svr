'use strict';
const Boom = require('boom');
const Joi = require('joi');
const User = require('../../models/User');

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
                deletedAt: null
            };
        }
        const users = await User.find(
            match,
            '_id permissions name username created_at updated_at deleted_at'
        );

        const response = {
            count: users.length,
            prepared: new Date(),
            users: users
        };
        return response;
    } // End handler
}; // End route
