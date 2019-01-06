'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Image = require('../../models/Image');
const User = require('../../models/User');

module.exports = {
    method: 'GET',
    path: '/{imageID}',
    options: {
        auth: {
            mode: 'optional' // Only required to view private images
        },
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
        const imageID = req.params.imageID;
        const req_user = req.auth.credentials;
        try {
            var image_result = await Image.aggregate([
                {
                    $match: {
                        img_id: imageID
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'created_by',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $project: {
                        img_id: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        expires_at: 1,
                        is_private: 1,
                        is_deleted: 1,
                        caption: 1,
                        _id: 0,
                        user: {
                            name: 1,
                            username: 1
                        }
                    }
                },
                { $unwind: '$user' },
                {
                    $addFields: {
                        absolute_url: {
                            $concat: [
                                `${process.env.SERVER_URL}/file/`,
                                '$img_id'
                            ]
                        }
                    }
                }
            ]);
            image_result = image_result[0];
        } catch (err) {
            return Boom.internal(
                'Internal error: Finding image with ID' + imageID
            );
        }
        if (image_result == false) {
            return Boom.notFound('There was no image found for this ID.');
        }
        if (image_result.is_private) {
            if (!req_user) {
                return Boom.unauthorized('This image is private.');
            }
        }
        if (image_result.is_deleted) {
            return Boom.resourceGone('This image has been deleted.');
        }
        if (image_result.expires_at && image_result.expires_at < new Date()) {
            return Boom.resourceGone('This image has expired.');
        }
        return image_result;
    } // End handler
}; // End route
