const Joi = require("joi")

module.exports = {
  method: "POST",
  path: "/api/newUser",
  options: {
    validate: {
      headers: {
        api_key: Joi.string().length(27).required()
      }
    }
  },
  handler: async function (req) {
    
  }
}