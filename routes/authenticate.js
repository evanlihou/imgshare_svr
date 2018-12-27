'use strict';
const Boom = require('boom');
const Bcrypt = require('bcrypt-nodejs');
const Joi = require('joi');
const Jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

module.exports = {
    method: 'POST',
    path: '/login',
    options: {
        auth: false
        // validate: {
        //     payload: {
        //         username: Joi.string()
        //             .alphanum()
        //             .required(),
        //         password: Joi.string().required()
        //     }
        // }
    },
    async handler(req, h) {
        const username = req.payload.username;
        const password = req.payload.password;
        const api_key = req.payload.api_key;
        var user;
        var isAuthenticated = false;
        if (!(username && password) && !api_key) {
            return Boom.badRequest('Improperly formatted payload.');
        }
        if (api_key) {
            // Authenticate using API key
            user = await User.findOne({ api_key });
            if (!user) {
                return Boom.unauthorized('Invalid API key');
            }
            isAuthenticated = true;
        } else {
            // Authenticate using user/pass
            user = await User.findOne({ username });
            if (!user) {
                return Boom.unauthorized('Invalid username or password');
            } else if (!user.password_hash || !user.permissions) {
                return Boom.badImplementation(
                    `The following user's DB entry is not structured properly: ${username}`
                );
            }
            isAuthenticated = Bcrypt.compareSync(password, user.password_hash);
        }
        if (isAuthenticated) {
            var expires_at_time = new Date();
            expires_at_time.setMinutes(expires_at_time.getMinutes() + 30); // Expires in 30 min
            const newSession = new Session({
                issued_at: new Date(),
                expires_at: expires_at_time,
                user: user._id
            });
            newSession.save();
            return Jwt.sign(
                {
                    username: user.username,
                    permissions: user.permissions,
                    name: user.name,
                    session_id: newSession._id
                },
                process.env.TOKEN_KEY
            );
        }
        return Boom.unauthorized('Invalid credentials');
    }
};
