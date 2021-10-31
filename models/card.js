const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { actionTypes } = require('../constants');

const CardActionSchema = new Schema({
  type: {
    type: String,
    lowercase: true,
    enum: actionTypes,
    required: 'Card actions must have a type'
  },
  required: {
    type: Boolean,
    default: false
  },
  qty: {
    type: Number,
    min: 0,
    required: 'Card actions must have qty greater than -1'
  }
});

const CardSchema = new Schema({
  modifiedAt: {
    type: Date,
    default: Date.now
  },
  qty: {
    type: Number,
    default: 0
  },
  art: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    required: 'Kindly enter the name of the card'
  },
  actions: {
    type: [CardActionSchema]
  },
  costBuy: {
    type: Number,
    default: 0
  },
  buyingPower: {
    type: Number,
    default: 0
  },
  victoryPoints: {
    type: Number,
    default: 0
  }
});

CardSchema.methods.decreaseQty = function() {
  this.qty -= 1;
};

module.exports = CardSchema;
