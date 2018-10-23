'use strict';
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');
const Mongoose = require('mongoose');

// Route definitions
const GetImage = require('./routes/getImage');
const UploadImage = require('./routes/uploadImage');
const Authenticate = require('./routes/authenticate');
const NewUser = require('./routes/newUser');
const ServeImage = require('./routes/serveImage');
const AllImages = require('./routes/allImages');

const api = {
    register: async function (server, options) {
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


        Mongoose.connect(db_conn, { useNewUrlParser: true })
        Mongoose.connection.once('open', () => {
            console.log('Successfully connected to database')
        });
        await server.register({
            plugin: require('hapi-mongodb'),
            options: dbOpts
        }).catch((err) => {
            throw 'Could not connect to database: ', err;
        });

        const swaggerOptions = {
            basePath: '/api/',
            tags: [{name: 'image'}, {name: 'user'}],
            info: {
                    title: 'ImgShare API',
                    version: Pack.version,
                    contact: {
                        name: "Evan Lihou",
                        url: "https://evanlihou.com",
                        email: "evan@evanlihou.com"
                    },
            },
        };
        
        await server.register([
            Inert,
            Vision,
            {
                plugin: HapiSwagger,
                options: swaggerOptions
            }
        ]);

        server.route(GetImage);
        server.route(UploadImage);
        server.route(Authenticate);
        server.route(NewUser);
        server.route(ServeImage);
        server.route(AllImages);

        server.expose('registered', true);

    },
    name: 'imgshare_svr',
    version: '0.2.0'
};

module.exports = api;
