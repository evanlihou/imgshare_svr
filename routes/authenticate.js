const Boom = require("boom")
const bcrypt = require("bcrypt-nodejs")

module.exports = {
  method: "POST",
  path: "/authenticate",
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
    }
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
    db.close();
  }
}