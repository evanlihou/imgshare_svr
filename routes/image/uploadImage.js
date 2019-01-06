'use strict';
const Boom = require('boom');
const IsBase64 = require('is-base64');
const RandomString = require('randomstring');
const JoiDataUri = require('joi-dataURI');
const Joi = require('joi').extend(JoiDataUri);
const ImageDataUri = require('image-data-uri');

const GetImage = require('./getImage');

const User = require('../../models/User');
const Image = require('../../models/Image');

module.exports = {
    method: 'POST',
    path: '/',
    options: {
        payload: {
            // Mongo only supports files up to 16 MB, this allows for slightly
            // larger payloads for other data
            maxBytes: 17 * 1024 * 1024,
            parse: true
        },
        validate: {
            headers: Joi.object({}).options({ allowUnknown: true }),
            payload: Joi.object({
                caption: Joi.string().optional(),
                is_private: Joi.any(),
                expires_at: Joi.any(),
                img_data: Joi.dataURI().optional(),
                img_file: Joi.binary().optional() // Should be a file stream, no way in Joi API to validate
            })
                .xor('img_data', 'img_file')
                .options({ allowUnknown: true })
        }
    },
    async handler(req, h) {
        const img_data = req.payload.img_data;
        const img_file = req.payload.img_file;
        const req_user = req.auth.credentials;

        if (!img_file && !IsBase64(img_data)) {
            // TODO: check null buffer
            return Boom.badRequest('Invalid image data.');
        }
        if (!req_user.permissions.can_upload) {
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
        } while (!unique_id_chosen);

        const new_img = new Image({
            img_id: random_id,
            expires_at: req.payload.expires_at
                ? new Date(req.payload.expires_at)
                : null,
            created_by: req_user._id,
            is_private: req.payload.is_private ? req.payload.is_private : false,
            is_deleted: req.payload.is_deleted ? req.payload.is_deleted : false,
            caption: req.payload.caption ? req.payload.caption : null
        });

        if (img_data) {
            const uri = ImageDataUri.decode(img_data);
            new_img.image_file = uri.dataBuffer;
        } else if (img_file) {
            new_img.image_file = img_file;
        }

        const insert_result = await new_img.save().catch((err) => {
            console.error(err);
            return Boom.internal(
                'An error occured while trying to save the image.'
            );
        });

        return GetImage.handler(
            {
                auth: req.auth,
                params: { imageID: insert_data.img_id },
                headers: req.headers
            },
            h
        );
    }
};
