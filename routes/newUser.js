'use strict';
const Joi = require('joi');
const Boom = require('boom');
const Bcrypt = require('bcrypt-nodejs');
const RandomString = require('randomstring');
const User = require('../models/User');

module.exports = {
    method: 'POST',
    path: '/api/newUser',
    options: {
        validate: {
            headers: Joi.object({
                api_key: Joi.string().alphanum()
            }).options({ allowUnknown: true }),
            payload: {
                username: Joi.string().required(),
                password: Joi.string().required(),
                permissions: Joi.object().keys({
                    is_admin: Joi.bool().required(),
                    can_upload: Joi.bool().required(),
                    can_delete_own: Joi.bool().required()
                })
            }
        }
    },
    async handler(req, h) {

        const api_key = req.headers.api_key;
        try {
            var user_info = await User.findOne({ api_key });
        }
        catch (err) {
            return Boom.internal(
                'An internal error has occured while trying to pull user by API key.'
            );
        }

        if (!user_info.permissions.is_admin) {
            return Boom.unauthorized('You must be admin to create users.');
        }

        let random_id = '';
        let unique_id_chosen = false;
        do {
            random_id = RandomString.generate({
                length: 32
            });
            const users_with_id = await User.findOne({
                api_key: random_id
            });

            if (!users_with_id) {
                unique_id_chosen = true;
            }
        }
        while (!unique_id_chosen);

        const salt = Bcrypt.genSaltSync(10);
        const new_user_info = new User({
            username: req.payload.username,
            password_hash: Bcrypt.hashSync(req.payload.password, salt),
            api_key: random_id,
            created_at: new Date(),
            permissions: {
                is_admin: req.payload.permissions.is_admin,
                can_upload: req.payload.permissions.can_upload,
                can_delete_own: req.payload.permissions.can_delete_own
            }
        });

        const db_responce = await new_user_info.save().catch((err) => {
            console.error(err)
            return Boom.internal(err)
        });

        var insert_data = db_response.toObject()
        delete insert_data._id

        return insert_data;
    }
};
