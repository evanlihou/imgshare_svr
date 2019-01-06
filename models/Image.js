const Mongoose = require('mongoose');

const Schema = Mongoose.Schema;

const ImageSchema = new Schema({
    image_data: String,
    image_file: Schema.Types.Buffer,
    img_id: String,
    caption: String,
    // created_at: Date,
    expires_at: Date,
    created_by: Schema.Types.ObjectId,
    is_private: Boolean,
    is_deleted: Boolean
});

module.exports = Mongoose.model('Image', ImageSchema);
