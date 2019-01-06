'use strict';
const Pack = require('./package');
const Mongoose = require('mongoose');
const Boom = require('boom');
const Jwt = require('jsonwebtoken');

const Authenticate = require('./routes/authenticate');

// Models
const Session = require('./models/Session');
const User = require('./models/User');

const api = {
    register: async function(server, options) {
        // Set up Mongo
        const db_conn =
            'mongodb://' +
            process.env.MONGO_USERNAME +
            ':' +
            process.env.MONGO_PASSWORD +
            '@' +
            process.env.MONGO_SVR +
            '/' +
            process.env.MONGO_DB;

        const dbOpts = {
            url: db_conn,
            settings: {
                poolSize: 10
            },
            decorate: true
        };

        Mongoose.connect(
            db_conn,
            { useNewUrlParser: true }
        ).catch((e) => {
            console.error('Unable to connect to MongoDB server');
            process.exit(1);
        });

        await server.register(require('./jobs')).catch((err) => {
            throw 'Error initializing jobs';
        });

        await server
            .register({
                plugin: require('hapi-mongodb'),
                options: dbOpts
            })
            .catch((err) => {
                throw ('Could not connect to database: ', err);
            });

        const validateToken = require('./helpers/validateToken');

        // A very quick and dirty way to see if current auth is valid
        // Used for clients to check whether reauth is required due to expired session
        server.route({
            method: 'GET',
            path: '/check_auth',
            async handler(req, h) {
                console.log(req.headers);
                const valid = (await validateToken(
                    Jwt.decode(req.headers.authorization),
                    req
                )).isValid;
                if (!valid) {
                    return Boom.unauthorized();
                }
                return { valid: true };
            }
        });

        await server.register(require('hapi-auth-jwt2'));
        server.auth.strategy('jwt', 'jwt', {
            key: process.env.TOKEN_KEY,
            validate: validateToken,
            verifyOptions: { algorithms: ['HS256'] }
        });

        server.auth.default('jwt');

        // Set up routes
        server.register(require('./routes/image/routes'), {
            routes: { prefix: '/image' }
        });
        server.register(require('./routes/user/routes'), {
            routes: { prefix: '/user' }
        });

        // Routes without prefixes
        server.route(Authenticate);

        // Tell the server we're all set
        server.expose('registered', true);
    },
    name: 'imgshare_svr',
    version: Pack.version
};

module.exports = api;
