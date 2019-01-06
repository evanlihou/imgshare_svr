'use strict';
const Hapi = require('hapi');
const Boom = require('boom');
const Api = require('./api');
require('dotenv').config();

const server = new Hapi.server({
    host: process.env.SERVER_HOST,
    port: process.env.SERVER_PORT,
    routes: {
        cors: {
            origin: ['http://localhost:3000', 'https://i.evanlihou.com'],
            additionalHeaders: ['api_key']
        },
        validate: {
            failAction: async (request, h, err) => {
                if (process.env.NODE_ENV === 'production') {
                    // In prod, log a limited error message and throw the default Bad Request error.
                    console.error('ValidationError:', err.message);
                    throw Boom.badRequest(`Invalid request payload input`);
                } else {
                    // During development, log and respond with the full error.
                    console.error(err);
                    throw err;
                }
            }
        }
    }
});

server
    .register(Api, {
        routes: {
            prefix: '/api'
        }
    })
    .then(() => {
        server.start();
    })
    .then(() => {
        console.log(`Server running at: ${server.info.uri}`);
    })
    .catch((err) => {
        console.error('ERROR: ' + err);
    });
