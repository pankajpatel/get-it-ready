// file: models/person.js
const Joi = require('joi');
const getItReady = require('../../../index');

module.exports = (db) => {
  const personDefinition = {
    firstName: {
      type: String,
      required: true,
      joi: Joi.string(),
    },
    lastName: {
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
  };

  return getItReady(personDefinition, 'people', 'Person', 'person', db);
};
