# get-it-ready

Generate Joi Validation, Mongoose Model and basic API endpoint routes for hapijs

## Inspiration

While doing hapijs app with mongoose, there was a problem with Mongoose schemas and Joi validations; they were most of the times same. And the REST API was surely going to have few predefined routes; why not have a constructor to do all this at once. 

Once constructor will bridge the problem of multiple configurations for Mongoose and Joi. And also quicky return the controller methods and Routes to easily plug into Hapijs app.

## Description

This lib can be used to generate the schema, model, necessary controllers and routes that can be directly plugged into Hapijs app.

Few restrictions:
* Mongoose models and schemas can/will be used
* Output controllers and routes are for Hapijs
* Controllers are named as 
  * getAll
  * getOne
  * create
  * update
  * remove
* Routes 
  * GET all
  * GET one
  * POST one
  * PUT one
  * DELETE one

## Usage

### Automatic

For automatic/quick usage, the method will need all following four parameters.

* __*object*__ schemaDefinitionObject This object is a mixture of Mongoose Schema Definition and Joi validation object. The keys which you wanna put in Joi validation, create a `joi` named key in the value object
* __*string*__ routeBaseName Route base in plurals
* __*string*__ modelName Model name
* __*string*__ singularRouteName Route base in singular

It returns a Collection object containing ingredients of REST which are ready to be plugged to hapijs

#### Example

```
var Joi = require('joi');
var getItReady = require('get-it-ready');

var personDefinition = {
  name: { 
    type: String, 
    required: true 
  },
  firstName: { 
    type: String, 
    required: true, 
    joi: Joi.string() 
  },
  lastName: { 
    type: String, 
    required: true, 
    joi: Joi.string() 
  },
  createdOn: { 
    type: Date, 
    required: false, 
    default: Date.now, 
    joi: Joi.date() 
  }
};

var person = getItReady(personDefinition, 'persons', 'Person', 'person');

console.log(person.validations, person.schema, person.model, person.controller, person.routes);
```

See above code in action at [https://runkit.com/pankaj/get-it-ready](https://runkit.com/pankaj/get-it-ready)

### Manual

For manual opration of this lib, the order of execution of methods is very important. The order of execution should be 
* `separateJoiValidationObject`
  * @param  {object} _config_ The mixture of Schema Config and Joi config object
  * @return {object}
* `getSchema`
  * @param  {object} _schema_ definition object
  * @return {object} mongoose schema
* `getModel`
  * @param  {string} _modelName_ The Mongoose Model name
  * @param  {object} _schema_ The Mongoose Schema object
  * @return {object} model The Mongoose model
* `getControllers`
  * @param  {object} _model_ The Mongoose model object
  * @param  {object} _joiValidationObject_ The Joi validation objects
  * @return {object} object containing controller methods
* `getRoutes`
  * @param  {object} _controllers_ The object containing controller methods
  * @param  {string} _routeBaseName_ The string which should be used for routebase
  * @param  {string} _singularRouteName_ The singular entity name for routes
  * @return {object} The routes object which can be plugged in hapijs or can be extended more

#### Example

```
var Joi = require('joi');
var getItReady = require('get-it-ready');

var personDefinition = {
  firstName: { 
    type: String, 
    required: true, 
    joi: Joi.string() 
  },
  lastName: { 
    type: String, 
    required: true, 
    joi: Joi.string() 
  },
  createdOn: { 
    type: Date, 
    required: false, 
    default: Date.now, 
    joi: Joi.date() 
  }
};

var validations = getItReady.separateJoiValidationObject(personDefination);
var schema      = getItReady.getSchema(validations.schema);
var model       = getItReady.getModel(modelName, schema);
var controllers = getItReady.getControllers(model, validations);
var routes      = getItReady.getRoutes(controllers, routeBaseName, singularRouteName);

console.log(validations, schema, model, controller, routes);
```

## Built With

* Joi - For repharsing the validatons on POST and PUT requests
* Boom - Errors of Hapijs
* Mongoose - MongoDB Schema and Models for routes
