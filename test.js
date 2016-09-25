var test = require('tape');
var Joi = require('joi');
var Mongoose = require('mongoose');
var getItReady = require('./index');

var automaticSchemaDefinition = {
  name: { type: String, required: false, joi: Joi.string() },
  firstName: { type: String, required: true, joi: Joi.string() },
  lastName: { type: String, required: true, joi: Joi.string() },
  status: { type: String, required: false, joi: Joi.string() },
  photo: { type: String, required: false, joi: Joi.string() },
  createdOn: { type: Date, required: false, default: Date.now, joi: Joi.date() }
};
var manualSchemaDefinition = {
  firstName: { type: String, required: true, joi: Joi.string() },
  lastName: { type: String, required: true, joi: Joi.string() },
  createdOn: { type: Date, required: false, default: Date.now, joi: Joi.date() }
};
var result = null;
var manual = {};

function teardown(){
  Mongoose.connection.close()
}

function testWrapper (description, fn) {
  test(description, function (t) {
    // setup(); //Will be needed later
    fn(t);
    teardown();
  });
}

testWrapper('getItReady', function (t) {
  t.doesNotThrow(function () {
    result = getItReady(automaticSchemaDefinition, 'persons', 'Person', 'person')
  }, 'should not throw error');
  t.end();
});

testWrapper('results', function (t) {
  t.equal(typeof result, 'object', 'Result should be an object')
  t.deepEqual(
      Object.keys(result),
      ['validations', 'schema', 'model', 'controllers', 'routes'],
      'Result should have keys: schema, model, controllers, results'
    )
  t.end()
})

testWrapper('results.schema', function (t) {
  t.equal(typeof result.schema, 'object', 'should be an object')
  t.ok(result.schema instanceof Mongoose.Schema, 'should be the instanceof Mongoose.Schema')
  t.end()
})

testWrapper('results.model', function (t) {
  t.ok(result.model, 'should exist')
  t.equal(result.model.modelName, 'Person', 'should have the supplied model name')
  t.end()
})

testWrapper('results.controllers', function (t) {
  // console.log( Object.keys( result.controllers ) )
  t.equal(typeof result.controllers, 'object', 'should be an object')
  t.deepEqual(Object.keys(result.controllers), [ 'getAll', 'getOne', 'create', 'update', 'remove' ])
  t.end()
})

testWrapper('results.routes', function (t) {
  t.equal(typeof result.routes, 'object')
  t.end()
})

testWrapper('manual control', function (t) {
  t.ok(getItReady.separateJoiValidationObject, 'should have separateJoiValidationObject method')
  t.ok(getItReady.getControllers, 'should have getControllers method')
  t.ok(getItReady.getRoutes, 'should have getRoutes method')
  t.ok(getItReady.getModel, 'should have getModel method')
  t.ok(getItReady.getSchema, 'should have getSchema method')
  t.end();
});

testWrapper('manual: separateJoiValidationObject ', function (t) {
  manual.separateJoiValidationObject = getItReady.separateJoiValidationObject(manualSchemaDefinition);
  var keys = Object.keys(manualSchemaDefinition);

  t.ok(manual.separateJoiValidationObject.schema, 'should have a schema object');
  t.deepEqual(Object.keys(manual.separateJoiValidationObject.schema), keys, 'new schema should have same key as input')

  t.ok(manual.separateJoiValidationObject.post, 'should have a post obejct')
  t.deepEqual(Object.keys(manual.separateJoiValidationObject.post), keys, 'post should have same key as input')

  t.ok(manual.separateJoiValidationObject.put, 'should have a put object')
  t.deepEqual(Object.keys(manual.separateJoiValidationObject.put), keys, 'put schema should have same key as input')

  t.end();
});

testWrapper('manual: getSchema ', function (t) {
  t.doesNotThrow(function () {
    manual.getSchema = getItReady.getSchema(manual.separateJoiValidationObject.schema);
  } , 'should not throw error');
  t.ok(manual.getSchema instanceof Mongoose.Schema, 'should return a valid Schema object');
  t.end();
});

testWrapper('manual: getModel ', function (t) {
  t.doesNotThrow(function () {
    manual.getModel = getItReady.getModel( 'SchemaName', manual.getSchema);
  } , 'should not throw error');
  t.ok(manual.getModel, 'should return a valid Model object');
  t.equal(manual.getModel.modelName, 'SchemaName', 'should have model name as specified');
  t.end();
});

testWrapper('manual: getControllers ', function (t) {
  t.doesNotThrow(function () {
    manual.getControllers = getItReady.getControllers(manual.getModel, manual.separateJoiValidationObject);
  } , 'should not throw error');
  t.ok(manual.getControllers, 'should return controllers collection');
  t.deepEqual(
    Object.keys(manual.getControllers),
    ['getAll', 'getOne', 'create', 'update', 'remove'],
    'should have required controller methods'
  );
  t.end();
});

testWrapper('manual: getRoutes ', function (t) {
  t.doesNotThrow(function () {
    manual.getRoutes = getItReady.getRoutes(manual.getControllers, 'persons', 'person');
  } , 'should not throw error');
  t.ok(manual.getRoutes, 'should return routes collection');
  t.equal( manual.getRoutes.length, 5, 'should have desired number of routes');
  var methods = ['GET', 'POST', 'PUT', 'DELETE']
  for (var i = manual.getRoutes.length - 1; i >= 0; i--) {
    var index = methods.indexOf(manual.getRoutes[i].method);
    t.ok( index >= 0, 'should have a valid HTTP method');
    t.ok(manual.getRoutes[i].path.match('/persons'), 'should have a valid HTTP method');
    //vrey  brittle and crude way to test path, may be enhanced later
    if( i < 4 && i > 0 ){
      t.ok(manual.getRoutes[i].path.match('/persons/{id}'), 'should have good path for '+methods[index]);
    }
  }

  t.end();
});
