const Mongoose = require('mongoose');
const Schema = Mongoose.Schema

const UserSchema = new Schema({
    name: String,
    username: String,
    password_hash: String,
    api_key: String,
    permissions: {
        is_admin: Boolean,
        can_upload: Boolean,
        can_delete_own: Boolean
    }
},  { _id: true, timestamps: true });

module.exports = Mongoose.model('User', UserSchema);