'use strict';
const Boom = require('boom');
const IsBase64 = require('is-base64');
const RandomString = require('randomstring');
const JoiDataUri = require('joi-dataURI');
const Joi = require('joi').extend(JoiDataUri);
const DataUri = require('datauri');

const User = require('../models/User');
const Image = require('../models/Image');

const file_to_dataURI = function (img_file) {

    const img_data = new DataUri();
    img_data.format('.png', img_file);
    return img_data.content;
};

module.exports = {
    method: 'POST',
    path: '/api/uploadImage',
    options: {
        payload: {
            // NOTE: This is probably way too high, and likely would be stopped by Nginx before it got here in prod
            // If you're running into issues with your payload being too big and you're using Data URIs, try converting into files
            // If you're using PNGs, try switching to compressed JPEGs (notably with iPhone photos, they're huge)
            maxBytes: 50 * 1024 * 1024
        },
        validate: {
            headers: Joi.object({
                api_key: Joi.string().alphanum()
            }).options({ allowUnknown: true }),
            payload: Joi.object({
                is_private: Joi.any(),
                expires_at: Joi.any(),
                img_data: Joi.dataURI().optional(),
                img_file: Joi.any().optional() // Should be a file stream, no way in Joi API to validate
            }).options({ allowUnknown: true })
        }
    },
    async handler(req, h) {

        let img_data = req.payload.img_data;
        const img_file = req.payload.img_file;
        if (img_file) {
            img_data = await file_to_dataURI(img_file);
        }
        const api_key = req.headers.api_key;

        try {
            var user_info = await User.findOne({ api_key });
        }
        catch (err) {
            return Boom.internal(
                'An internal error has occured while trying to pull user by API key.'
            );
        }

        if (!img_file && !IsBase64(img_data)) {
            return Boom.badRequest('Invalid image data.');
        }
        else if (!user_info) {
            return Boom.unauthorized('Invalid API key');
        }
        else if (!user_info.permissions.can_upload) {
            return Boom.unauthorized(
                'This user does not have upload permissions.'
            );
        }
        // Create the image
        let random_id = '';
        let unique_id_chosen = false;
        do {
            random_id = RandomString.generate({
                length: 5,
                capitalization: 'lowercase'
            });
            const imgs_with_id = await Image.findOne({ url: random_id });

            if (!imgs_with_id) {
                unique_id_chosen = true;
            }
        }
        while (!unique_id_chosen);

        const new_img = new Image({
            image_data: img_data,
            url: random_id,
            created_at: new Date(),
            expires_at: req.payload.expires_at
                ? new Date(req.payload.expires_at)
                : null,
            created_by: user_info._id,
            is_private: req.payload.is_private
                ? req.payload.is_private
                : false,
            is_deleted: req.payload.is_deleted
                ? req.payload.is_deleted
                : false
        });

        const insert_result = await new_img.save().catch((err) => {
            console.error(err)
            return Boom.internal(err)
        })

        var insert_data = insert_result.toObject()
        delete insert_data._id
        delete insert_data.created_by
        
        return insert_data
    }
};
