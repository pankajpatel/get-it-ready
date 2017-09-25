// file: models/post.js
module.exports = (db) => {
  const Joi = require('joi');
  const Boom = require('boom');
  const { Schema } = require('mongoose');
  const getItReady = require('../../../index');

  const definition = {
    text: {
      type: String,
      required: true,
      joi: Joi.string(),
    },
    createdOn: {
      type: Date,
      required: false,
      default: Date.now,
      joi: Joi.date(),
    },
    likedBy: {
      type: [Schema.ObjectId],
      default: [],
      required: false,
      joi: Joi.array().items(Joi.string()),
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      joi: Joi.date(),
    },
  };

  // const artifacts = getItReady(definition, 'posts', 'Post', 'post');

  const validations = getItReady.separateJoiValidationObject(definition);
  const schema = getItReady.getSchema(validations.schema);
  const model = getItReady.getModel('Post', schema, db);
  const controllers = getItReady.getControllers(model, validations, 'post');
  const routes = getItReady.getRoutes(controllers, 'posts', 'post');

  routes.push({
    method: 'PUT',
    path: '/posts/{id}/likes',
    config: {
      description: 'Update a post\'s likes',
      notes: 'Adds the user like for specified post',
      tags: ['api', 'posts'],
    },
    handler: (request, reply) => {
      model.findOne({
        _id: request.params.id,
      }, (err, dbObject) => {
        if (err) reply(Boom.badImplementation(err)); // 500 error

        if (dbObject.likedBy.indexOf(request.payload.user) < 0) {
          dbObject.likedBy.push(request.payload.user);
        }
        dbObject.save((error, data) => {
          if (!error) {
            reply(data); // HTTP 201
          } else if (error.code === 11000 || error.code === 11001) {
            reply(Boom.forbidden('please provide another post id, it already exist'));
          } else {
            reply(Boom.forbidden(error)); // HTTP 403
          }
        });
      });
    },
  });

  routes.push({
    method: 'DELETE',
    path: '/posts/{id}/likes',
    config: {
      description: 'Update a post\'s likes',
      notes: 'Removes the user like for specified post',
      tags: ['api', 'posts'],
    },
    handler: (request, reply) => {
      model.findOne({
        _id: request.params.id,
      }, (err, dbObject) => {
        if (err) reply(Boom.badImplementation(err)); // 500 error

        if (dbObject.likedBy.indexOf(request.payload.user) < 0) {
          dbObject.likedBy.splice(dbObject.likedBy.indexOf(request.payload.user), 1);
        }
        dbObject.save((error, data) => {
          if (!error) {
            reply(data); // HTTP 201
          } else if (error.code === 11000 || error.code === 11001) {
            reply(Boom.forbidden('please provide another post id, it already exist'));
          } else {
            reply(Boom.forbidden(error)); // HTTP 403
          }
        });
      });
    },
  });

  return {
    routes,
  };
};
