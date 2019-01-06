const Pack = require('../package');
const Mongoose = require('mongoose');
const Agenda = require('agenda');

const Session = require('../models/Session');

module.exports = {
    name: 'jobs',
    version: Pack.version,
    register: async function(server, options) {
        const agenda = new Agenda({ mongo: Mongoose.connection });

        agenda.define('clean sessions', async (job, done) => {
            var clean_time = new Date();
            clean_time.setDate(clean_time.getDate() - 2); // Expired 2 days ago
            await Session.remove({ expires_at: { $lt: clean_time } });
        });

        await agenda.start();

        await agenda.every('24 hours', 'clean sessions');
    }
};
