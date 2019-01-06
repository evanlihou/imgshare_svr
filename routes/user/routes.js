const Pack = require('../../package');

const NewUser = require('./newUser');
const AllUsers = require('./allUsers');
const DeleteUser = require('./deleteUser');
const EditUser = require('./editUser');

const UserRoutes = {
    name: 'users',
    version: Pack.version,
    register: async function(server, options) {
        server.route(NewUser);
        server.route(AllUsers);
        server.route(DeleteUser);
        server.route(EditUser);
    }
};

module.exports = UserRoutes;
