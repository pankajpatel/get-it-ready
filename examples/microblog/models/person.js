// file: models/person.js
const Joi = require('joi');
const getItReady = require('../../../index');

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

module.exports = getItReady(personDefinition, 'people', 'Person', 'person');
