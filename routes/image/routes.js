const Pack = require('../../package');

const GetImage = require('./getImage');
const UploadImage = require('./uploadImage');
const ServeImage = require('./serveImage');
const AllImages = require('./allImages');
const DeleteImage = require('./deleteImage');
const EditImage = require('./editImage');

const ImageRoutes = {
    name: 'images',
    version: Pack.version,
    register: async function(server, options) {
        server.route(GetImage);
        server.route(UploadImage);
        server.route(ServeImage);
        server.route(AllImages);
        server.route(DeleteImage);
        server.route(EditImage)
    }
};

module.exports = ImageRoutes;
