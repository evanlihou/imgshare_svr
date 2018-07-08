const Mongoose = require('mongoose');
const Schema = Mongoose.Schema

const UserSchema = new Schema({
    _id: Schema.Types.ObjectId,
    username: String,
    password_hash: String,
    api_key: String,
    created_at: Date,
    permissions: {
        is_admin: Boolean,
        can_upload: Boolean,
        can_delete_own: Boolean
    }
});

module.exports = Mongoose.model('User', UserSchema);