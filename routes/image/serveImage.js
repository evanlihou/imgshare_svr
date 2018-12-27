'use strict';
const Joi = require('joi');
const Boom = require('boom');
const User = require('../../models/User');
const Image = require('../../models/Image');

module.exports = {
    method: 'GET',
    path: '/file/{id}',
    options: {
        auth: {
            mode: 'optional' // Only required for private images
        },
        validate: {
            headers: Joi.object({
                api_key: Joi.string()
                    .alphanum()
                    .optional()
            }).options({ allowUnknown: true })
        }
    },
    async handler(req, h) {
        const img_id = req.params.id;
        // const api_key = req.headers.api_key;
        const req_user = req.auth.credentials;
        try {
            var img = await Image.findOne({ img_id });
        } catch {
            return Boom.internal(
                'An error occured while fetching the image record.'
            );
        }
        if (!img) {
            return Boom.notFound();
        }

        if (img.is_private && !req_user) {
            return Boom.unauthorized('This image is private.');
        }

        if (img.is_deleted) {
            return Boom.resourceGone('This image has been deleted.');
        }
        if (img.expires_at && img.expires_at < new Date()) {
            return Boom.resourceGone('This image has expired.');
        }
        return h
            .response(img.image_file)
            .header('Content-Disposition', 'inline')
            .header('Content-type', 'image/png');
    }
};
