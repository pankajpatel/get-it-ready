var test = require('tape');
var Mongoose = require('mongoose');
var getItReady = require('./index');

var schemaDefinition = {
  name: { type: String, required: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  status: { type: String, required: false },
  photo: { type: String, required: false },
  createdOn: { type: Date, required: false, default: Date.now }
};
var result = null;

function wrapper (description, fn) {
  test(description, function (t) {
    setup();
    fn(t);
    teardown();
  });
}

test('getItReady', function (t) {
  t.doesNotThrow(function () {
    result = getItReady(schemaDefinition, 'persons', 'Person', 'person')
  }, 'should not throw error');
  t.end();
});

test('results', function (t) {
  t.equal(typeof result, 'object', 'Result should be an object')
  t.deepEqual(
      Object.keys(result),
      ['schema', 'model', 'controller', 'routes'],
      'Result should have keys: schema, model, controller, results'
    )
  t.end()
})

test('results.schema', function (t) {
  t.equal(typeof result.schema, 'object', 'should be an object')
  t.ok(result.schema instanceof Mongoose.Schema, 'should be the instanceof Mongoose.Schema')
  t.end()
})

test('results.model', function (t) {
  t.ok(result.model, 'should exist')
  t.equal(result.model.modelName, 'Person', 'should have the supplied model name')
  t.end()
})

test('results.controller', function (t) {
  // console.log( Object.keys( result.controller ) )
  t.equal(typeof result.controller, 'object', 'should be an object')
  t.deepEqual(Object.keys(result.controller), [ 'getAll', 'getOne', 'create', 'update', 'remove' ])
  t.end()
})

test('results.routes', function (t) {
  t.equal(typeof result.routes, 'object')
  t.end()
})
