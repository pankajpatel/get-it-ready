var test = require('tape');
var getItReady = require('./index');

var schemaDefinition = {
  name: { type: String, required: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  status: { type: String, required: false },
  photo: { type: String, required: false },
  createdOn: { type: Date, required: false, default: Date.now }
};

test('getItReady', function (t) {
  t.doesNotThrow(function () {
    getItReady(schemaDefinition, 'persons', 'Person', 'person')
  });
  t.end();
});
