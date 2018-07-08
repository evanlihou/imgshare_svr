'use strict';
const Hapi = require('hapi');
const Api = require('./api');
require('dotenv').config();

const server = new Hapi.server({
    host: process.env.SERVER_HOST,
    port: process.env.SERVER_PORT,
    routes: {
        cors: {
            additionalHeaders: ['api_key']
        }
    }
});

server
    .register(Api)
    .then(() => {

        server.start();

    })
    .then(() => {

        console.log(`Server running at: ${server.info.uri}`);

    })
    .catch((err) => {

        console.error('ERROR: ' + err);

    });
