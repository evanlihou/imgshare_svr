const Boom = require("boom")
const bcrypt = require("bcrypt-nodejs")
const Joi = require("joi")

module.exports = {
  method: "POST",
  path: "/api/authenticate",
  options: {
    validate: {
      payload: {
        username: Joi.string().alphanum().required(),
        password: Joi.string().required()
      }
    }
  },
  async handler(req, h) {
    const username = req.payload.username;
    const password = req.payload.password;
    const db = req.mongo.db;
    const user_collection = db.collection("users");
    const user = await user_collection.findOne({
      username: username
    });
    if (!user) {
      return Boom.unauthorized("Incorrect username or password");
    } else {
      let isAuthenticated = bcrypt.compareSync(password, user.password_hash);
      if (isAuthenticated) {
        return {
          username: user.username,
          api_key: user.api_key,
          premissions: user.permissions
        };
      } else {
        return Boom.unauthorized("Incorrect username or password");
      }
    }
    db.close();
  }
}