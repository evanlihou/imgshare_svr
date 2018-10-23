'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Image = require('../models/Image');
const User = require('../models/User');

const responseSchema = Joi.object({
    count: Joi.number(),
    prepared: Joi.date(),
    imgs: Joi.array().items(Joi.object({
        created_at: Joi.date(),
        expires_at: Joi.date().optional(),
        created_by: Joi.string(),
        is_private: Joi.boolean(),
        is_deleted: Joi.boolean(),
        img_id: Joi.string(),
        user: Joi.object({
            username: Joi.string()
        })
    }))
})

module.exports = {
    method: 'GET',
    path: '/image',
    options: {
        tags: ['api', 'image'],
        description: "Get all images",
        validate: {
            headers: Joi.object({
                api_key: Joi.string()
                    .alphanum()
                    .optional()
                    .description("API Key for the user. Must have is_admin to use header all=true."),
                all: Joi.bool().optional().description("Whether to display all images, including deleted, private, and expired.")
            }).options({ allowUnknown: true })
        },
        //response: {schema: responseSchema}
    },
    async handler(req) {
        const api_key = req.headers.api_key;
        const req_user = await User.findOne({ api_key });
        if (!req_user) {
            return Boom.unauthorized('User not found.');
        } else if (req.headers.all && !req_user.permissions.is_admin) {
            return Boom.unauthorized('Insufficient permissions');
        }
        let match = {}
        if (!req.headers.all) {
            match = {
                is_deleted: false,
                $or: [
                    {expires_at: {$gt: new Date()}},
                    {expires_at: null}
                ],
                is_private: false
            }
        } else {
            match = {}
        }
        const imgs = await Image.aggregate([
            {$match: match},
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
            {$unwind: {
                path: "$user",
                preserveNullAndEmptyArrays: true
            }}
        ]);

        const response = {
            count: imgs.length,
            prepared: new Date(),
            imgs: imgs
        }
        return response
    } // End handler
}; // End route
