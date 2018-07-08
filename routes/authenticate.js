'use strict';
const Boom = require('boom');
const Bcrypt = require('bcrypt-nodejs');
const Joi = require('joi');
const User = require('../models/User');

module.exports = {
    method: 'POST',
    path: '/api/authenticate',
    options: {
        validate: {
            payload: {
                username: Joi.string()
                    .alphanum()
                    .required(),
                password: Joi.string().required()
            }
        }
    },
    async handler(req, h) {

        const username = req.payload.username;
        const password = req.payload.password;
        const user = await Users.findOne({ username });
        if (!user) {
            return Boom.unauthorized('Incorrect username or password');
        }
        else if (!user.password_hash || !user.permissions) {
            return Boom.badImplementation(
                `The following user's DB entry is not structured properly: ${username}`
            );
        }
        const isAuthenticated = Bcrypt.compareSync(
            password,
            user.password_hash
        );
        if (isAuthenticated) {
            return {
                username: user.username,
                api_key: user.api_key,
                premissions: user.permissions
            };
        }
        return Boom.unauthorized('Incorrect username or password');
        db.close();
    }
};
