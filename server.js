'use strict';
const Hapi = require('hapi');
const Api = require('./api');
require('dotenv').config();

const server = new Hapi.server({
    host: process.env.SERVER_HOST,
    port: process.env.SERVER_PORT,
    routes: {
        cors: {
            origin: ['http://localhost:3000', 'https://i.evanlihou.com'],
            additionalHeaders: ['api_key']
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
