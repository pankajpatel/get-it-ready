var Mongoose = require('mongoose'),
    Schema = Mongoose.Schema;
    ObjectID = Schema.ObjectId;
var Joi = require('joi'),
    Boom = require('boom');

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

function getJoiValidationObject(config){
    
}

function getController(model){
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
              payload: {
                scholarNumber: Joi.number(),
                name: Joi.string(),
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                photo: Joi.string(),
                parent: Joi.string(),
                status: Joi.string(),
                standard: Joi.string()
              }
            },
            handler: function(request, reply) {
              var payload = request.payload;

              var object = new Student(payload);

              object.save(function(err, data) {
                if (!err) {
                  reply(data).created('/' + data._id); // HTTP 201
                } else {
                  if (11000 === err.code || 11001 === err.code) {
                    reply(Boom.forbidden('please provide another ' + singularRouteName + ' id, it already exist'));
                  } else reply(Boom.forbidden(getErrorMessageFrom(err))); // HTTP 403
                }
              });
            }
        },
        update: {
            validate: {
                payload: {
                    username: Joi.string().required()
                }
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
                                } else reply(Boom.forbidden(getErrorMessageFrom(err))); // HTTP 403
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

function getModel(schema){
    return model = Mongoose.model(modelName, schema);
}

function getSchema(config){
    return schema = new Schema(config);
}

// Sample code
var schema = new Schema({
    name: { type: String, required: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    status: { type: String, required: false },
    photo: { type: String, required: false },
    createdOn: { type: Date, required: false, default: Date.now }
})


module.exports = decorate;