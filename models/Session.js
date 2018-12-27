const Mongoose = require('mongoose');

const Schema = Mongoose.Schema;

const SessionSchema = new Schema({
    issued_at: Schema.Types.Date,
    expires_at: Schema.Types.Date,
    user: Schema.Types.ObjectId
});

module.exports = Mongoose.model('Session', SessionSchema);
