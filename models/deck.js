const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Card = require('./card');

const DeckSchema = new Schema({
  cards: {
    type: [Card],
    default: []
  }
});

DeckSchema.methods.shuffle = () => {
  return Array.from(this.cards).sort(() => Math.random() - 0.5);
};

module.exports = mongoose.models.Deck || mongoose.model('Deck', DeckSchema);
