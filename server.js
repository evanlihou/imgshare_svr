'use strict';
const MongoClient = require('mongodb').MongoClient;
const Hapi = require('hapi');
const config = require('./package.json')
const Joi = require('joi');
const Boom = require('boom');
const isBase64 = require('is-base64')
const RandomString = require('randomstring')
require('dotenv').config()

const launchServer = async function() {

  const db_conn = "mongodb://"+process.env.MONGO_USERNAME+":"+
    process.env.MONGO_PASSWORD+"@"+process.env.MONGO_SVR+"/"+
    process.env.MONGO_DB
    
  const dbOpts = {
      url: db_conn,
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
          image: Joi.string().length(5).alphanum().lowercase()
        }
      }
    },
    async handler(req, h) {
      const imageID = req.params.image
      const db = req.mongo.db
      const ObjectID = req.mongo.ObjectID
      const collection = db.collection('images')
      try {
        var result = await collection.findOne({url: imageID}, {_id: 0})
      } catch (err) {
        console.error(err)
        return Boom.internal('An internal error occured when trying to find an image with that ID.')
      }
      if (result) {
        if (result.is_private) {
          return Boom.unauthorized('This image is private.')
        } else if (result.is_deleted) {
          return Boom.resourceGone('This image is deleted.')
        } else if (result.expires_at && result.expires_at < new Date()) {
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
      const img_data = req.payload.img_data
      const api_key = req.payload.api_key

      const db = req.mongo.db
      const ObjectID = req.mongo.ObjectID
      const user_collection = db.collection("users")
      const img_collection = db.collection("images")
      try {
        var user_info = await user_collection.findOne({api_key: api_key})
      } catch (err) {
        return Boom.internal("An internal error has occured while trying to pull user by API key.")
      }
      
      if (!isBase64(img_data)) {
        return Boom.badRequest('Invalid image data.')
      } else if (!user_info) {
        return Boom.unauthorized("Invalid API key")
      } else if (!user_info.permissions.can_upload) {
        return Boom.unauthorized("This user does not have upload permissions.")
      } else {
        // Create the image
        var uniquie_id_chosen = false;
        do {
          var random_id = RandomString.generate({
            length: 5,
            capitalization: "lowercase"
          })
          let imgs_with_id = await img_collection.findOne({url: random_id})

          if (!imgs_with_id) {
            uniquie_id_chosen = true
          }
        } while (!uniquie_id_chosen)
        console.log("ID chosen")
        img_collection.insert({
          image_data: img_data,
          url: random_id,
          created_at: new Date(),
          expires_at: (req.payload.expires_at ? req.payload.expires_at : null),
          created_by: user_info._id,
          is_private: (req.payload.is_private ? req.payload.is_private : false),
          is_deleted: (req.payload.is_deleted ? req.payload.is_deleted : false)
        }, function(err, doc) {
          console.log("entered insert callback")
          if (err) {
            console.error(err)
            return Boom.internal("An internal error occured while trying to create the image.")
          } else {
            console.log("created")
            return doc
          }
        })
        return Boom.internal("The image creation did not return anything.")
      }
    }
  })

  await server.start();
  console.log(`Server started at ${server.info.uri}`);
};

launchServer().catch((err) => {
  console.error(err);
  process.exit(1);
});

