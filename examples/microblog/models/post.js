// file: models/post.js
const Joi = require('joi');
const { Schema } = require('mongoose');
const getItReady = require('../../../index');

const definition = {
  text: {
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
  likedBy: {
    type: [Schema.ObjectId],
    default: [],
    required: false,
    joi: Joi.array().items(Joi.string()),
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    joi: Joi.date(),
  },
};

module.exports = getItReady(definition, 'posts', 'Post', 'post');
