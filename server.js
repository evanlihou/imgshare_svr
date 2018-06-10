'use strict';
const MongoClient = require('mongodb').MongoClient;
const Hapi = require('hapi');
const config = require('./package.json')
const Joi = require('joi');
const Boom = require('boom')

// TODO: Remove these temporary credentials
// They'll be changed and are for a local server with a firewall, they won't do you much good anyway.
const MONGO_SVR = "localhost:27017"
const MONGO_USERNAME = "imgshare_svr"
const MONGO_PASSWORD = "HXmTQFRwcsu7"
const MONGO_DB = "imgshare"

const launchServer = async function() {
    
  const dbOpts = {
      url: "mongodb://"+MONGO_USERNAME+":"+MONGO_PASSWORD+"@"+MONGO_SVR+"/"+MONGO_DB,
      settings: {
          poolSize: 10
      },
      decorate: true
  };
  
  const server=Hapi.server({
    host: 'localhost',
    port: 8000
  });
  
  await server.register({
      plugin: require('hapi-mongodb'),
      options: dbOpts
  });

  server.route({
    method:'GET',
    path:'/info',
    handler:function(request,h) {
      var data = {
        status: 'Success',
        version: config.version,
  
      }
      return data;
    }
  });
  
  server.route({
    method: 'GET',
    path: '/getImage/{image}',
    options: {
      validate: {
        params: {
          image: Joi.string().length(24).hex()
        }
      }
    },
    async handler(req, h) {
      const imageID = req.params.image
      const db = req.mongo.db
      const ObjectID = req.mongo.ObjectID
      const collection = db.collection('images')
      try {
        var result = await collection.findOne({_id: new ObjectID(imageID)})
      } catch (err) {
        console.error(err)
        return Boom.internal('An internal error occured when trying to find an image with that ID.')
      }
      if (result) {
        if (result.is_private) {
          return Boom.unauthorized('This image is private.')
        } else if (result.is_deleted) {
          return Boom.resourceGone('This image is deleted.')
        } else if (result.expires_at < new Date()) {
          return Boom.resourceGone('This image has expired.')
        } else {
          return result
        }
      } else {
        return Boom.notFound('There was no image found for this ID.')
      }
    }
  })

  server.route({
    method: 'POST',
    path: '/uploadImage',
    async handler (req, h) {
      return Boom.notImplemented()
    }
  })

  await server.start();
  console.log(`Server started at ${server.info.uri}`);
};

launchServer().catch((err) => {
  console.error(err);
  process.exit(1);
});

