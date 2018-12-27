'use strict';
const Pack = require('./package');
const Mongoose = require('mongoose');
const Boom = require('boom');

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

        await server
            .register({
                plugin: require('hapi-mongodb'),
                options: dbOpts
            })
            .catch((err) => {
                throw ('Could not connect to database: ', err);
            });

        // TODO: Tjos should go somewhere else, it's cluttering up the file
        const validateToken = async function(decoded, request) {
            if (!decoded) {
                throw Boom.unauthorized(null, 'Unable to decode your session');
            }
            if (!decoded.session_id) {
                return { isValid: false };
            }
            const session = await Session.findById(decoded.session_id);
            if (!session) {
                return { isValid: false };
            }
            if (session.expires_at < new Date()) {
                // Expired
                return { isValid: false };
            }
            // Associated user exists in DB
            const user = await User.findById(session.user);
            if (!user) {
                return { isValid: false };
            }
            // Update expiration of token
            var expires_at_time = new Date();
            expires_at_time.setMinutes(expires_at_time.getMinutes() + 30); // Expires in 30 min
            session.expires_at = expires_at_time;
            session.save();
            return { isValid: true, credentials: user };
        };

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
