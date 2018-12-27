const Pack = require('../../package');

const NewUser = require('./newUser');
const AllUsers = require('./allUsers');

const ImageRoutes = {
    name: 'users',
    version: Pack.version,
    register: async function(server, options) {
        server.route(NewUser);
        server.route(AllUsers);
    }
};

module.exports = ImageRoutes;
