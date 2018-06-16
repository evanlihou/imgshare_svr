'use strict';

const Hapi = require('hapi');
const config = require('./package.json')
const Joi = require('joi');
const Boom = require('boom');
const isBase64 = require('is-base64')
const RandomString = require('randomstring')
const bcrypt = require('bcrypt-nodejs');
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
    port: 8000,
    routes: { cors: true },
    debug: {
      log: ['error']
    }
  });
  
  await server.register({
      plugin: require('hapi-mongodb'),
      options: dbOpts
  });
  
  server.route({
    method: 'POST',
    path: '/getImage',

    async handler(req, h) {
      const imageID = req.payload.url
      const api_key = req.payload.api_key
      const db = req.mongo.db
      const ObjectID = req.mongo.ObjectID
      const img_collection = db.collection('images')
      const user_collection = db.collection('users')
      try {
        var result = await img_collection.findOne({url: imageID}, {_id: 0})
      } catch (err) {
        console.error(err)
        return Boom.internal('An internal error occured when trying to find an image with that ID.')
      }
      if (result) {
        if (result.is_private) {
          if (api_key) {
            const user = await user_collection.findOne({api_key: api_key})
            if (!user) {
              return Boom.unauthorized('This image is private.')
            } else {
              // We have credentials
              if (user) {
                result.username = user.username
              }
              return result
            }
          } else {
            return Boom.unauthorized('This image is private.')
          }
        } else if (result.is_deleted) {
          return Boom.resourceGone('This image is deleted.')
        } else if (result.expires_at && result.expires_at < new Date()) {
          return Boom.resourceGone('This image has expired.')
        } else {
          const user = await user_collection.findOne({_id: result.created_by})
          if (user) {
            result.username = user.username
          }
          return result
        }
      } else {
        return Boom.notFound('There was no image found for this ID.')
      }
      db.close()
    }
  })

  server.route({
    method: 'POST',
    path: '/uploadImage',
    async handler (req, h) {
      const img_data = req.payload.img_data
      const api_key = req.payload.api_key
      const db = req.mongo.db
      const user_collection = db.collection("users")
      const img_collection = db.collection("images")
      try {
        var user_info = await user_collection.findOne({api_key: api_key})
      } catch (err) {
        return Boom.internal("An internal error has occured while trying to pull user by API key.")
      }
      
      if (!isBase64(img_data)) {
        console.log(img_data)
        return Boom.badRequest('Invalid image data. - '+req.payload)
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
        var new_img = {
          image_data: img_data,
          url: random_id,
          created_at: new Date(),
          expires_at: (req.payload.expires_at ? new Date(req.payload.expires_at) : null),
          created_by: user_info._id,
          is_private: (req.payload.is_private ? req.payload.is_private : false),
          is_deleted: (req.payload.is_deleted ? req.payload.is_deleted : false)
        }
        var insert_result = await img_collection.insertOne(new_img,).then((res) => {
          if (res.result.ok !== 1) {
            console.error("Err", err)
            return Boom.internal("An internal error occured while trying to create the image.")
          } else {
            return new_img
          }
        })
        return insert_result
      }
    }
  })

  server.route({
    method: 'POST',
    path: '/authenticate',
    async handler(req, h) {
      const username = req.payload.username
      const password = req.payload.password
      const db = req.mongo.db
      const user_collection = db.collection("users")
      const user = await user_collection.findOne({username: username})
      if (!user) {
        return Boom.unauthorized("Incorrect username or password")
      }
      let isAuthenticated = bcrypt.compareSync(password, user.password_hash)
      if (isAuthenticated) {
        console.log(user.username, " logged in")
        return {
          username: user.username,
          api_key: user.api_key,
          premissions: user.permissions
        }
      } else {
        return Boom.unauthorized("Incorrect username or password")
      }
      db.close()
    }
  })

  await server.start();
  console.log(`Server started at ${server.info.uri}`);
};

launchServer().catch((err) => {
  console.error(err);
  process.exit(1);
});

