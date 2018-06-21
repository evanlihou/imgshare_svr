const Hapi = require("hapi");
require("dotenv").config();

// Route definitions
const getImage = require('./routes/getImage')
const uploadImage = require('./routes/uploadImage')
const authenticate = require('./routes/authenticate')
const newUser = require('./routes/newUser')

const launchServer = async function() {
  const db_conn =
    "mongodb://" +
    process.env.MONGO_USERNAME +
    ":" +
    process.env.MONGO_PASSWORD +
    "@" +
    process.env.MONGO_SVR +
    "/" +
    process.env.MONGO_DB;

  const dbOpts = {
    url: db_conn,
    settings: {
      poolSize: 10
    },
    decorate: true
  };

  const server = Hapi.server({
    host: process.env.SERVER_HOST,
    port: process.env.SERVER_PORT,
    routes: {
      cors: true
    }
  });

  await server.register({
    plugin: require("hapi-mongodb"),
    options: dbOpts
  });

  // Routes, documentation can be found on GitHub
  server.route(getImage);
  server.route(uploadImage);
  server.route(authenticate);
  server.route(newUser);

  await server.start();
  console.log(`Server started at ${server.info.uri}`);
};

launchServer().catch(err => {
  console.error(err);
  process.exit(1);
});
