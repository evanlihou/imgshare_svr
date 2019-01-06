'use strict';
'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Image = require('../../models/Image');

module.exports = {
    method: 'DELETE',
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
            headers: Joi.object({}).options({ allowUnknown: true })
        }
    },
    async handler(req, h) {
        const img_id = req.params.imageID;
        const req_user = req.auth.credentials;
        try {
            var image_result = await Image.findOne({ img_id });
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
            (!req_user.permissions.can_delete_own ||
                image_result.created_by != req_user._id)
        ) {
            return Boom.unauthorized(
                'You do not own this image so can not delete it.'
            );
        }
        if (image_result.is_deleted) {
            return Boom.resourceGone('This image has been deleted.');
        }
        image_result.is_deleted = true;
        image_result.save();
        return true;
    } // End handler
}; // End route
