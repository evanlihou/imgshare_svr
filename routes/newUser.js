const Joi = require("joi")
const Boom = require("boom")
const bcrypt = require("bcrypt-nodejs")
const RandomString = require("randomstring")

module.exports = {
  method: "POST",
  path: "/api/newUser",
  options: {
    validate: {
      headers: Joi.object({
        api_key: Joi.string().alphanum()
      }).options({allowUnknown: true}),
      payload: {
        username: Joi.string().required(),
        password: Joi.string().required(),
        permissions: Joi.object().keys({
          is_admin: Joi.bool().required(),
          can_upload: Joi.bool().required(),
          can_delete_own: Joi.bool().required()
        })
      }
    }
  },
  async handler (req, h) {
    const api_key = req.headers.api_key;
    const db = req.mongo.db;
    const user_collection = db.collection("users");
    try {
      var user_info = await user_collection.findOne({
        api_key: api_key
      });
    } catch (err) {
      return Boom.internal(
        "An internal error has occured while trying to pull user by API key."
      );
    }

    if (!user_info.permissions.is_admin) {
      return Boom.unauthorized("You must be admin to create users.")
    }

    const salt = bcrypt.genSaltSync(10)
    do {
      var random_id = RandomString.generate({
        length: 32,
      });
      let users_with_id = await user_collection.findOne({
        api_key: random_id
      });

      if (!users_with_id) {
        uniquie_id_chosen = true;
      }
    } while (!uniquie_id_chosen);
    const newUser = {
      username: req.payload.username,
      password_hash: bcrypt.hashSync(req.payload.password, salt),
      api_key: random_id,
      created_at: new Date(),
      permissions: {
        is_admin: req.payload.permissions.is_admin,
        can_upload: req.payload.permissions.can_upload,
        can_delete_own: req.payload.permissions.can_delete_own
      }
    }
    var new_user = await user_collection.insertOne(newUser).then(res => {
      if (res.result.ok != 1) {
        console.error(err)
        return Boom.internal("Internal error while creating user")
      } else {
        return newUser
      }
    })
    return new_user
  }
}