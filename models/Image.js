const Mongoose = require('mongoose');
const Schema = Mongoose.Schema

const ImageSchema = new Schema({
    image_data: String,
    url: String,
    created_at: Date,
    expires_at: Date,
    created_by: Schema.Types.ObjectId,
    is_private: Boolean,
    is_deleted: Boolean
});

module.exports = Mongoose.model('Image', ImageSchema);