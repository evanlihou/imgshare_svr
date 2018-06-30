const Boom = require("boom")
const Joi = require("joi")

module.exports = {
  method: "GET",
  path: "/api/getImage/{imageID}",
  options: {
    validate: {
      params: {
        imageID: Joi.string().length(5).alphanum().lowercase().required()
      },
      headers: Joi.object({
        api_key: Joi.string().alphanum().optional()
      }).options({allowUnknown: true})
    }
  },
  async handler (req) {
    const imageID = req.params.imageID;
    const api_key = req.headers.api_key;
    const db = req.mongo.db;
    const img_collection = db.collection("images");
    const user_collection = db.collection("users");
    try {
      // Get image
      var result = await img_collection.findOne(
        {
          url: imageID
        },
        {
          _id: 0 // Don't return internal ID
        }
      );
    } catch (err) {
      return Boom.internal(
        "An internal error occured when trying to find an image with that ID."
      );
    }
    if (!result) {
      return Boom.notFound("There was no image found for this ID.");
    } else {
      if (result.is_private) {
        if (api_key) {
          const req_user = await user_collection.findOne({
            api_key: api_key
          });
          if (!req_user) {
            return Boom.unauthorized("This image is private.");
          } else {
            // We have credentials
            const img_user = await user_collection.findOne({
              _id: result.created_by
            });
            if (img_user) {
              result.username = img_user.username;
            }
            return result;
          }
        } else {
          return Boom.unauthorized("This image is private.");
        }
      } else if (result.is_deleted) {
        return Boom.resourceGone("This image has been deleted.");
      } else if (result.expires_at && result.expires_at < new Date()) {
        return Boom.resourceGone("This image has expired.");
      } else {
        const img_user = await user_collection.findOne({
          _id: result.created_by
        });
        if (img_user) {
          result.username = img_user.username;
        }
        return result;
      }
    } // End if image
    db.close();
  } // End handler
} // End route