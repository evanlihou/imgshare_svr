'use strict';
const Boom = require('boom');
const IsBase64 = require('is-base64');
const RandomString = require('randomstring');
const JoiDataUri = require('joi-dataURI');
const Joi = require('joi').extend(JoiDataUri);
const ImageDataUri = require('image-data-uri');

const GetImage = require('./getImage');

const User = require('../models/User');
const Image = require('../models/Image');

module.exports = {
    method: 'POST',
    path: '/image',
    options: {
        payload: {
            // Mongo only supports files up to 16 MB, this allows for slightly
            // larger payloads for other data
            maxBytes: 17 * 1024 * 1024,
            parse: true
        },
        validate: {
            headers: Joi.object({
                api_key: Joi.string().alphanum()
            }).options({ allowUnknown: true }),
            payload: Joi.object({
                is_private: Joi.any(),
                expires_at: Joi.any(),
                img_data: Joi.dataURI().optional(),
                img_file: Joi.binary().optional() // Should be a file stream, no way in Joi API to validate
            }).xor('img_data', 'img_file').options({ allowUnknown: true })
        }
    },
    async handler(req, h) {
        const img_data = req.payload.img_data;
        const img_file = req.payload.img_file;
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
            img_id: random_id,
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

        if (img_data) {
            const uri = ImageDataUri.decode(img_data)
            new_img.image_file = uri.dataBuffer;
        } else if (img_file) {
            new_img.image_file = img_file
        }

        const insert_result = await new_img.save().catch((err) => {
            console.error(err)
            return Boom.internal(err)
        })

        var insert_data = insert_result.toObject()
        // Don't return these fields in the response
        delete insert_data._id
        delete insert_data.created_by

        const response = {
            img_id: insert_data.img_id,
            created_at: insert_data.created_at
        }

        return GetImage.handler({params: {imageID: insert_data.img_id}, headers: req.headers}, h)
        
        return response
    }
};
