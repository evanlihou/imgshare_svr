const Boom = require("boom")

module.exports = {
  method: "POST",
  path: "/getImage",
  handler: async function (req) {
    const imageID = req.payload.url;
    const api_key = req.payload.api_key;
    const db = req.mongo.db;
    const img_collection = db.collection("images");
    const user_collection = db.collection("users");
    try {
      var result = await img_collection.findOne(
        {
          url: imageID
        },
        {
          _id: 0
        }
      );
    } catch (err) {
      console.error(err);
      return Boom.internal(
        "An internal error occured when trying to find an image with that ID."
      );
    }
    if (result) {
      if (result.is_private) {
        if (api_key) {
          const user = await user_collection.findOne({
            api_key: api_key
          });
          if (!user) {
            return Boom.unauthorized("This image is private.");
          } else {
            // We have credentials
            if (user) {
              result.username = user.username;
            }
            return result;
          }
        } else {
          return Boom.unauthorized("This image is private.");
        }
      } else if (result.is_deleted) {
        return Boom.resourceGone("This image is deleted.");
      } else if (result.expires_at && result.expires_at < new Date()) {
        return Boom.resourceGone("This image has expired.");
      } else {
        const user = await user_collection.findOne({
          _id: result.created_by
        });
        if (user) {
          result.username = user.username;
        }
        return result;
      }
    } else {
      return Boom.notFound("There was no image found for this ID.");
    }
    db.close();
  }
    
}