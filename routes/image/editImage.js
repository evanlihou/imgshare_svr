'use strict';
'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Image = require('../../models/Image');

module.exports = {
    method: 'PATCH',
    path: '/{imageID}',
    options: {
        tags: ['api', 'image'],
        validate: {
            params: {
                imageID: Joi.string()
                    .length(5)
                    .alphanum()
                    .lowercase()
                    .required()
            },
            payload: {
                caption: Joi.string().optional(),
                is_private: Joi.bool().optional(),
                expires_at: Joi.date().optional(),
                is_deleted: Joi.bool().optional()
            }, //.options({ allowUnknown: true }),
            headers: Joi.object({}).options({ allowUnknown: true })
        }
    },
    async handler(req, h) {
        const img_id = req.params.imageID;
        const req_user = req.auth.credentials;
        try {
            var image_result = await Image.findOne({ img_id });
            console.log(image_result);
        } catch (err) {
            return Boom.internal(
                'Internal error: Finding image with ID' + img_id
            );
        }
        if (image_result == false) {
            return Boom.notFound('There was no image found for this ID.');
        }
        if (
            !req_user.permissions.is_admin &&
            image_result.created_by != req_user._id
        ) {
            return Boom.unauthorized(
                'You do not own this image so can not update it.'
            );
        }

        console.log('Before update');
        console.log(req.payload);
        await image_result.update(req.payload);
        image_result.save();
        console.log('After update');
        return true;
    } // End handler
}; // End route
