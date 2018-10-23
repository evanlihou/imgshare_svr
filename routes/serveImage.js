'use strict';
const Joi = require('joi');
const Boom = require('boom');
const User = require('../models/User');
const Image = require('../models/Image');

module.exports = {
    method: 'GET',
    path: '/file/{id}',
    options: {
        validate: {
            headers: Joi.object({
                api_key: Joi.string().alphanum().optional()
            }).options({ allowUnknown: true })
        }
    },
    async handler(req, h) {
        const img_id = req.params.id;
        const api_key = req.headers.api_key;

        try {
            var img = await Image.findOne({ img_id });
        }
        catch (err) {
            return Boom.internal(
                'An internal error has occured while trying to pull image.'
            );
        }

        if (!img) {
            return Boom.notFound()
        }

        if (img.is_private) {
            if (!api_key) {
                return Boom.unauthorized('This image is private.');
            }

            const req_user = await User.findOne({ api_key });
            if (!req_user) {
                return Boom.unauthorized('This image is private.');
            }
            // We have credentials
        }
        else if (img.is_deleted) {
            return Boom.resourceGone('This image has been deleted.');
        }
        else if (img.expires_at && img.expires_at < new Date()) {
            return Boom.resourceGone('This image has expired.');
        }
        const img_user = await User.findById(img.created_by);
        if (img_user) {
            img.username = img_user.username;
        }

        return h.response(img.image_file).header('Content-Disposition','inline').header('Content-type','image/png');;

    }
};
