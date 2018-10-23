'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Image = require('../models/Image');
const User = require('../models/User');

module.exports = {
    method: 'GET',
    path: '/image/{imageID}',
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
            headers: Joi.object({
                api_key: Joi.string()
                    .alphanum()
                    .optional()
            }).options({ allowUnknown: true })
        }
    },
    async handler(req, h) {

        const imageID = req.params.imageID;
        const api_key = req.headers.api_key;
        try {
            var image_result = await Image.aggregate([
                {$match: {
                    img_id: imageID
                }},
                {$lookup: {
                    from: "users",
                    localField: "created_by",
                    foreignField: "_id",
                    as: "user"
                }},
                {$project: {
                    img_id: 1,
                    created_at: 1,
                    expires_at: 1,
                    is_private: 1,
                    is_deleted: 1,
                    _id: 0,
                    user: {
                        name: 1,
                        username: 1
                    }
                }},
                {$unwind: '$user'},
                {$addFields: {
                    absolute_url: {$concat: [`${process.env.SERVER_URL}/file/`, "$img_id"]}
                }}
            ]);
        }
        catch (err) {
            return Boom.internal(
                'Internal error: Finding image with ID' + imageID
            );
        }
        if (image_result == false) {
            return Boom.notFound('There was no image found for this ID.');
        }
        else if (image_result.is_private) {
            if (api_key) {
                const req_user = await User.findOne({ api_key });
                if (!req_user) {
                    return Boom.unauthorized('This image is private.');
                }
            }
            else { return Boom.unauthorized('This image is private.'); }
        }
        else if (image_result.is_deleted) {
            return Boom.resourceGone('This image has been deleted.');
        }
        else if (image_result.expires_at && image_result.expires_at < new Date()) {
            return Boom.resourceGone('This image has expired.');
        }
        return image_result[0];
    } // End handler
}; // End route
