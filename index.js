var Mongoose = require('mongoose');
var Joi = require('joi');
var Boom = require('boom');

var Schema = Mongoose.Schema;
var ObjectID = Schema.ObjectId;

/**
 * @param  {object} schema definition object
 * @param  {string} route base in plurals
 * @param  {string} model name
 * @param  {string} route base in singular
 * @return {object} collection object containing ingredients of REST
 */
function decorate(schemaDefination, routeBaseName, modelName, singularRouteName){
  var schema = null;
  var model = null;
  var controller = {};
  var routes = [];

  schema = getSchema(schemaDefination);
  model = getModel(schema);
  controller = getController(model, routeBaseName);
  routes = getRoutes(controller);

  return {
    schema: schema,
    model: model,
    controller: controller,
    routes: routes
  }
}

/**
 * @param  {object}
 * @return {object}
 *
 * The model definition should have the Joi Definitions also
 * But not the required() method of Joi
 * because it will be added by this method
 * The Joi object will be used for both POST and PUT
 * only difference will be of required() in various keys among them
 */
function separateJoiValidationObject(config){
  var object = {};
  for (var prop in config) {
    var itemConf = config[prop];
    if ( itemConf === null ) {
      throw new Error('Null configs are not supported!');
    }
    var validation = itemConf.joi;

  }
}

/**
 * @param  {object} model
 * @param  {object} joiValidationObject
 * @return {object} object containing controller methods
 */
function getController(model, joiValidationObject){
  var controller = {
    getAll: {
      handler: function(request, reply) {
        model.find({}, function(err, data) {
          if (!err) {
            reply(data);
          } else {
            reply(Boom.badImplementation(err)); // 500 error
          }
        });
      }
    },
    getOne: {
      handler: function(request, reply) {
        model.findOne({
          '_id': ObjectID(request.params.id)
        }, function(err, data) {
          if (!err) {
            reply(data);
          } else {
            reply(Boom.notFound(err)); // 500 error
          }
        });
      }
    },
    create: {
      validate: {
        payload: joiValidationObject
      },
      handler: function(request, reply) {
        var payload = request.payload;

        var object = new model(payload);

        object.save(function(err, data) {
          if (!err) {
            reply(data).created('/' + data._id); // HTTP 201
          } else {
            if (11000 === err.code || 11001 === err.code) {
              reply(Boom.forbidden('please provide another ' + singularRouteName + ' id, it already exist'));
            } else {
              reply(Boom.forbidden(getErrorMessageFrom(err))); // HTTP 403
            }
          }
        });
      }
    },
    update: {
      validate: {
        payload: joiValidationObject
      },

      handler: function(request, reply) {
        model.findOne({
          '_id': request.params.id
        }, function(err, dbObject) {
          if (!err) {
            for (var prop in request.payload) {
              dbObject[prop] = request.payload[prop];
            }

            dbObject.save(function(err, data) {
              if (!err) {
                reply(data).updated('/' + data._id); // HTTP 201
              } else {
                if (11000 === err.code || 11001 === err.code) {
                  reply(Boom.forbidden('please provide another ' + singularRouteName + ' id, it already exist'));
                } else {
                  reply(Boom.forbidden(getErrorMessageFrom(err))); // HTTP 403
                }
              }
            });
          } else {
            reply(Boom.badImplementation(err)); // 500 error
          }
        });
      }
    },
    remove: {
      handler: function(request, reply) {
        model.findOne({
          '_id': ObjectID(request.params.id)
        }, function(err, dbObject) {
          if (!err && dbObject) {
            dbObject.remove();
            reply({
              message: singularRouteName + ' deleted successfully'
            });
          } else if (!err) {
            // Couldn't find the object.
            reply(Boom.notFound());
          } else {
            reply(Boom.badRequest('Could not delete ' + singularRouteName));
          }
        });
      }
    }
  };
  return controller;
}

/**
 * @param  {object}
 * @param  {string}
 * @return {object}
 */
function getRoutes(controller, routeBaseName){
  var routes = [
    {
      method : 'GET',
      path : '/' + routeBaseName,
      config: {
        description: 'Get all ' + routeBaseName + '',
        notes: 'Returns a list of ' + routeBaseName + ' ordered by addition date',
        tags: ['api', routeBaseName],
      },
      handler : controller.getAll.handler
    },
    {
      method : 'GET',
      path : '/' + routeBaseName + '/{id}',
      config: {
        description: 'Get ' + singularRouteName + ' by DB Id',
        notes: 'Returns the ' + singularRouteName + ' object if matched with the DB id',
        tags: ['api', routeBaseName],
      },
      handler : controller.getOne.handler
    },
    {
      method : 'PUT',
      path : '/' + routeBaseName + '/{id}',
      config: {
        validate: controller.create.validate,
        description: 'Add a ' + singularRouteName,
        notes: 'Returns a todo item by the id passed in the path',
        tags: ['api', routeBaseName],
      },
      handler : controller.create.handler
    },
    {
      method : 'DELETE',
      path : '/' + routeBaseName + '/{id}',
      config: {
        description: 'Delete ' + singularRouteName,
        notes: 'Returns the ' + singularRouteName + ' deletion status',
        tags: ['api', routeBaseName],
      },
      handler : controller.remove.handler
    },
    {
      method : 'POST',
      path : '/' + routeBaseName,
      config: {
        validate: controller.create.validate,
        description: 'Add a ' + singularRouteName,
        notes: 'Returns a todo item by the id passed in the path',
        tags: ['api', routeBaseName],
      },
      handler : controller.create.handler
    }
  ];
  return routes;
}

/**
 * @param  {object} mongoose schema object
 * @return {object} mongoose model
 */
function getModel(schema){
  return model = Mongoose.model(modelName, schema);
}

/**
 * @param  {object} schema definition object
 * @return {object} mongoose schema
 */
function getSchema(definitionObject){
  return schema = new Schema(definitionObject);
}

module.exports = decorate;
