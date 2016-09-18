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
    controller = getController(model);
    routes = getRoutes(controller);

    return {
        schema: schema,
        model: model,
        controller: controller,
        routes: routes
    }
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
                    reply(Boom.forbidden("please provide another student id, it already exist"));
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
                                    reply(Boom.forbidden("please provide another student id, it already exist"));
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
                            message: "Student deleted successfully"
                        });
                    } else if (!err) {
                        // Couldn't find the object.
                        reply(Boom.notFound());
                    } else {
                        reply(Boom.badRequest("Could not delete student"));
                    }
                });
            }
        }
    };
    return controller;
}

function getRoutes(controller){
    var routes = [
      {
        method : 'GET',
        path : '/' + baseName,
        config: {
          description: 'Get all Students',
          notes: 'Returns a list of students ordered by addition date',
          tags: ['api', 'students'],
        },
        handler : controller.getAll.handler
      },
      {
        method : 'GET',
        path : '/' + baseName + '/{id}',
        config: {
          description: 'Get Student by DB Id',
          notes: 'Returns the student object if matched with the DB id',
          tags: ['api', 'students'],
        },
        handler : controller.getOne.handler
      },
      {
        method : 'DELETE',
        path : '/' + baseName + '/{id}',
        config: {
          description: 'Delete Student',
          notes: 'Returns the student deletion status',
          tags: ['api', 'students'],
        },
        handler : controller.remove.handler
      },
      {
        method : 'POST',
        path : '/' + baseName,
        config: {
          validate: Students.create.validate,
          description: 'Add a student',
          notes: 'Returns a todo item by the id passed in the path',
          tags: ['api', 'students'],
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