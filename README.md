# get-it-ready
Generate Joi Validation, Mongoose Model and basic API endpoint routes for hapijs

```
var Joi = require('joi');
var getItReady = require('get-it-ready');

var definition = {
  name: { type: String, required: true },
  firstName: { type: String, required: true, joi: Joi.string() },
  lastName: { type: String, required: true, joi: Joi.string() },
  createdOn: { type: Date, required: false, default: Date.now, joi: Joi.date() }
};

var result = getItReady(definition, 'persons', 'Person', 'person');

console.log(result.schema, result.model, result.controller, result.routes);
```

See above code in action at [https://runkit.com/pankaj/57e73ec658d24b140011dbb6](https://runkit.com/pankaj/57e73ec658d24b140011dbb6)
