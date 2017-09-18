// file: index.js
const Hapi = require('hapi');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
  host: 'localhost',
  port: Number(process.argv[2]) || 8080,
});

server.register([
  require('inert'),
  require('vision'),
  {
    register: require('hapi-swagger'),
    options: {
      info: {
        title: 'API Documentation',
        version: '0.1.0',
      },
    },
  },
]);

// Add the route
server.route({
  method: 'GET',
  path: '/',
  handler(request, reply) {
    return reply('HapiJS Server running!');
  },
});


// Import the artefacts
const person = require('./models/person');
const post = require('./models/post');

// patch the artefacts to server routes
server.route(
  [].concat(person.routes, post.routes)
);
// done.

// Start the server
server.start((err) => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});
