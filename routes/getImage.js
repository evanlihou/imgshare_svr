'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Image = require('../models/Image');
const User = require('../models/User');

module.exports = {
    method: 'GET',
    path: '/api/getImage/{imageID}',
    options: {
        validate: {
            params: {
                imageID: Joi.string()
                    .length(5)
                    .alphanum()
                    .lowercase()
                    .required()
            },
            headers: Joi.object({
                api_key: Joi.string()
                    .alphanum()
                    .optional()
            }).options({ allowUnknown: true })
        }
    },
    async handler(req) {

        const imageID = req.params.imageID;
        const api_key = req.headers.api_key;
        try {
            // Get image as a plain JS object so we can add in keys later
            // TODO: This is hacky, fix
            var image_result = await Image.findOne({url: imageID}, '-_id').lean();
            console.log(image_result)
        }
        catch (err) {
            return Boom.internal(
                'An internal error occured when trying to find an image with that ID.'
            );
        }
        if (!image_result) {
            return Boom.notFound('There was no image found for this ID.');
        }
        if (image_result.is_private) {
            if (api_key) {
                const req_user = await User.findOne({ api_key });
                if (!req_user) {
                    return Boom.unauthorized('This image is private.');
                }
                // We have credentials
                const img_user = await User.findById(image_result.created_by);
                if (img_user) {
                    image_result.username = img_user.username;
                }
                return image_result;
            }
            return Boom.unauthorized('This image is private.');
        }
        else if (image_result.is_deleted) {
            return Boom.resourceGone('This image has been deleted.');
        }
        else if (image_result.expires_at && image_result.expires_at < new Date()) {
            return Boom.resourceGone('This image has expired.');
        }
        const img_user = await User.findById(image_result.created_by);
        if (img_user) {
            image_result.username = img_user.username;
        }
        return image_result;
    } // End handler
}; // End route
