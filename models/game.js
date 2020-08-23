const mongoose = require('mongoose');
const _ = require('lodash');
const Schema = mongoose.Schema;
const { actionTypes } = require('../constants');
const { Deck, DeckSchema } = require('./deck');
const PlayerSchema = require('./player');

const TurnSchema = new Schema(
  ['pre', 'during', 'post'].reduce((steps, turnStep) => {
    steps[turnStep] = actionTypes.reduce((actions, actionType) => {
      actions[actionType] = {
        required: {
          type: Number,
          min: 0,
          default: 0
        },
        optional: {
          type: Number,
          min: 0,
          default: 0
        }
      };
      return actions;
    }, {});
    return steps;
  }, {})
);

const TriggerSchema = new Schema({
  type: {
    type: String,
    enum: ['piles', 'turns'],
    lowercase: true,
    required: 'The end of game trigger must have a type'
  },
  qty: {
    type: Number,
    min: 1,
    required: 'The end of game trigger must have a positive qty'
  }
});

const SettingsSchema = new Schema({
  numPlayers: {
    type: Number,
    min: 1,
    required: 'You must have at least one player'
  },
  startingDeck: {
    type: DeckSchema,
    required: 'You must set a starting deck for players'
  },
  handSize: {
    type: Number,
    min: 0,
    required: 'You must set a non-negative hand size'
  },
  turn: {
    type: TurnSchema
  },
  endTrigger: {
    type: TriggerSchema,
    required: 'There must be an end of game trigger'
  }
});

const GameSchema = new Schema({
  deckId: {
    type: mongoose.ObjectId,
    required: 'A game must have an associated deckId'
  },
  settings: {
    type: SettingsSchema
  },
  currentPlayer: {
    type: Number,
    min: -1,
    default: -1
  },
  players: {
    type: [PlayerSchema],
    default: []
  },
  marketplace: {
    type: DeckSchema,
    default: new Deck()
  },
  discardPile: {
    type: DeckSchema,
    default: new Deck()
  },
  destroy: {
    type: DeckSchema,
    default: new Deck()
  },
  numTurns: {
    type: Number,
    default: 0
  },
  gameEnded: {
    type: mongoose.SchemaTypes.Mixed,
    default: false
  }
});

GameSchema.methods.isOver = () => {
  const { endTrigger: { type, qty } = {} } = this.settings;

  if (type === 'turns') {
    return this.numTurns >= qty;
  } else if (type === 'piles') {
    const emptyPiles = this.marketplace.cards.filter((card) => card.qty === 0);
    return emptyPiles.length >= qty;
  }
  return false;
};
GameSchema.methods.calculateStats = () => {
  const stats = {
    playerPoints: {},
    winner: ['', -1]
  };

  this.players.forEach((player) => {
    const allCards = player.hand + player.discard + player.deck;
    const points = allCards.reduce((sum, card) => (sum + card.victoryPoints), 0);
    stats.playerPoints[player.name] = points;
    if (points > stats.winner[1]) {
      stats.winner = [player.name, points];
    }
  });

  this.gameEnded = stats;
};

module.exports = mongoose.models.Game || mongoose.model('Game', GameSchema);
