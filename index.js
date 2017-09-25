const Mongoose = require('mongoose');
const Joi = require('joi');
const Boom = require('boom');
const Hoek = require('hoek');
const pluralize = require('pluralize');

const Schema = Mongoose.Schema;
const ObjectID = Schema.ObjectId;

/**
 * The model definition should have the Joi Definitions also
 * But not the required() method of Joi
 * because it will be added by this method
 * The Joi object will be used for both POST and PUT
 * only difference will be of required() in various keys among them
 *
 * @function
 * @name separateJoiValidationObject
 * @param  {object} config The Schema Config object
 * @return {object}
 */
function separateJoiValidationObject(config) {
  const post = {};
  const put = {};
  const schema = Object.assign({}, config);
  Object.keys(schema).forEach((prop) => {
    if (schema[prop] === null) {
      throw new Error('Null configs are not supported!');
    } else if (schema[prop].joi) {
      const itemConf = schema[prop];
      if (!itemConf.joi.isJoi) {
        itemConf.joi = Joi.object(itemConf.joi);
      }
      put[prop] = itemConf.joi;
      if (itemConf.required) {
        post[prop] = itemConf.joi.required();
      } else {
        post[prop] = itemConf.joi;
      }
      delete schema[prop].joi;
    }
  });
  return {
    schema,
    post,
    put,
  };
}

/**
 * @function
 * @name getController
 * @param  {object} model The Mongoose model object
 * @param  {object} joiValidationObject The Joi validation objects
 * @return {object} object containing controller methods
 */
function getControllers(model, joiValidationObject, singularRouteName) {
  const controllers = {
    getAll: {
      handler(request, reply) {
        model.find({}, (err, data) => {
          if (!err) {
            reply(data);
          } else {
            reply(Boom.badImplementation(err)); // 500 error
          }
        });
      },
    },
    getOne: {
      handler(request, reply) {
        model.findOne({
          _id: ObjectID(request.params.id),
        }, (err, data) => {
          if (!err) {
            reply(data);
          } else {
            reply(Boom.notFound(err)); // 500 error
          }
        });
      },
    },
    create: {
      validate: {
        payload: joiValidationObject.post,
      },
      handler(request, reply) {
        const payload = request.payload;

        const object = new model(payload);

        object.save((err, data) => {
          if (!err) {
            reply(data).created(`/${data._id}`); // HTTP 201
          } else if (err.code === 11000 || err.code === 11001) {
            reply(Boom.forbidden(`please provide another ${singularRouteName} id, it already exist`));
          } else {
            reply(Boom.forbidden(getErrorMessageFrom(err))); // HTTP 403
          }
        });
      },
    },
    update: {
      validate: {
        payload: joiValidationObject.put,
      },

      handler(request, reply) {
        model.findOne({
          _id: request.params.id,
        }, (err, dbObject) => {
          if (!err) {
            Object.keys(request.payload).forEach((prop) => {
              if (request.payload[prop]) {
                dbObject[prop] = request.payload[prop];
              }
            });

            dbObject.save((error, data) => {
              if (!error) {
                reply(data).created(`/${data._id}`); // HTTP 201
              } else if (error.code === 11000 || error.code === 11001) {
                reply(Boom.forbidden(`please provide another ${singularRouteName} id, it already exist`));
              } else {
                reply(Boom.forbidden(getErrorMessageFrom(error))); // HTTP 403
              }
            });
          } else {
            reply(Boom.badImplementation(err)); // 500 error
          }
        });
      },
    },
    remove: {
      handler(request, reply) {
        model.findOneAndRemove({
          _id: ObjectID(request.params.id),
        }, (err) => {
          if (!err) {
            reply({
              message: `${singularRouteName} deleted successfully`,
            });
          } else if (!err) {
            // Couldn't find the object.
            reply(Boom.notFound());
          } else {
            reply(Boom.badRequest(`Could not delete ${singularRouteName}`));
          }
        });
      },
    },
  };
  return controllers;
}

/**
 * @function
 * @name getRoutes
 * @param  {object} controllers The object containing controller methods
 * @param  {string} routeBaseName The string which should be used for routebase
 * @param  {string} singularRouteName The singular entity name for routes
 * @return {object} The routes object which can be plugged in hapijs or can be extended more
 */
function getRoutes(controllers, routeBaseName, singularRouteName) {
  const routes = [
    {
      method: 'GET',
      path: `/${routeBaseName}`,
      config: {
        description: `Get all ${routeBaseName}`,
        notes: `Returns a list of ${routeBaseName} ordered by addition date`,
        tags: ['api', routeBaseName],
      },
      handler: controllers.getAll.handler,
    },
    {
      method: 'GET',
      path: `/${routeBaseName}/{id}`,
      config: {
        description: `Get ${singularRouteName} by DB Id`,
        notes: `Returns the ${singularRouteName} object if matched with the DB id`,
        tags: ['api', routeBaseName],
      },
      handler: controllers.getOne.handler,
    },
    {
      method: 'PUT',
      path: `/${routeBaseName}/{id}`,
      config: {
        validate: controllers.update.validate,
        description: `Update a ${singularRouteName}`,
        notes: `Returns a ${singularRouteName} by the id passed in the path`,
        tags: ['api', routeBaseName],
      },
      handler: controllers.update.handler,
    },
    {
      method: 'DELETE',
      path: `/${routeBaseName}/{id}`,
      config: {
        description: `Delete ${singularRouteName}`,
        notes: `Returns the ${singularRouteName} deletion status`,
        tags: ['api', routeBaseName],
      },
      handler: controllers.remove.handler,
    },
    {
      method: 'POST',
      path: `/${routeBaseName}`,
      config: {
        validate: controllers.create.validate,
        description: `Add a ${singularRouteName}`,
        notes: `Returns a ${singularRouteName} by the id passed in the path`,
        tags: ['api', routeBaseName],
      },
      handler: controllers.create.handler,
    },
  ];
  return routes;
}

/**
 * @function
 * @name getModel
 * @param  {string} modelName The Mongoose Model name
 * @param  {object} schema The Mongoose Schema object
 * @param  {object} db The Mongoose DB object, if pased, use this otherwise use Mongoose
 * @return {object} model The Mongoose model
 */
function getModel(modelName, schema, db) {
  if (db === undefined) {
    db = Mongoose;
  }
  return db.model(modelName, schema);
}

/**
 * @function
 * @name getSchema
 * @param  {object} schema definition object
 * @return {object} mongoose schema
 */
function getSchema(definitionObject) {
  return new Schema(definitionObject);
}

/**
 * @function
 * @name decorate
 * @param  {object} schemaDefinitionObject The Schema definition object
 * @param  {string} routeBaseName Route base in plurals
 * @param  {string} modelName Model name
 * @param  {string} singularRouteName Route base in singular
 * @param  {object} db The Mongoose connection object
 * @return {object} Collection object containing ingredients of REST
 */
function decorate(schemaDefination, routeBaseName, modelName, singularRouteName, db) {
  Hoek.assert(schemaDefination, 'Schema Defination is required');
  Hoek.assert(routeBaseName, 'Route Base Name is required');
  Hoek.assert(modelName, 'Model Name is required');

  let validations = {};
  let schema = null;
  let model = null;
  let controllers = {};
  let routes = [];

  if (!singularRouteName) {
    singularRouteName = pluralize.singular(routeBaseName);
  }

  validations = separateJoiValidationObject(schemaDefination);
  schema = getSchema(validations.schema);
  model = getModel(modelName, schema, db);
  controllers = getControllers(model, validations, singularRouteName);
  routes = getRoutes(controllers, routeBaseName, singularRouteName);

  return {
    validations: {
      post: validations.post,
      put: validations.put,
    },
    schema,
    model,
    controllers,
    routes,
  };
}
/**
 * For Manual Control (If needed)
 */
decorate.separateJoiValidationObject = separateJoiValidationObject;
decorate.getSchema = getSchema;
decorate.getModel = getModel;
decorate.getControllers = getControllers;
decorate.getRoutes = getRoutes;

module.exports = decorate;
