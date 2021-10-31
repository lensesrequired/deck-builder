const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { actionTypes } = require('../constants');
const { Deck, DeckSchema } = require('./deck');

const PlayerSchema = new Schema({
  name: {
    type: String,
    required: 'Player must have a name'
  },
  hand: {
    type: DeckSchema,
    default: new Deck()
  },
  discardPile: {
    type: DeckSchema,
    default: new Deck()
  },
  deck: {
    type: DeckSchema,
    default: new Deck()
  },
  currentTurn:
    actionTypes.reduce((actions, actionType) => {
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
    }, { default: {} })
});

PlayerSchema.methods.startTurn = function(gameSettings) {
  const { discard, draw } = gameSettings.turn.pre;
  if (discard.required === -1) {
    this.discard();
  }
  if (draw.required) {
    this.draw(draw.required);
  }
  this.currentTurn = {
    ...gameSettings.turn.during,
    buyingPower: { optional: 0 }
  };
  return this;
};
PlayerSchema.methods.endTurn = function(gameSettings) {
  const { discard, draw } = gameSettings.turn.post;
  if (discard.required === -1) {
    this.discard();
  }
  if (draw.required) {
    this.draw(draw.required);
  }
  this.currentTurn = {};
  return this;
};
PlayerSchema.methods.isTurnFinished = function() {
  const currentTurn = JSON.parse(JSON.stringify(this.currentTurn));

  if ((this.deck.cards.length + this.discard.cards.length) === 0) {
    delete currentTurn.draw;
  }

  const playableCards = this.hand.cards.filter((card) => (!card.played));
  if (playableCards.length === 0) {
    delete currentTurn.discard;
    delete currentTurn.destroy;
    delete currentTurn.play;
  }

  return Object.values(currentTurn).some((qtys) => (qtys.required));
};
PlayerSchema.methods.checkAction = function(actionType, useAction = true) {
  let requiredQty;
  let optionalQty;
  if (this.currentTurn[actionType]) {
    requiredQty = this.currentTurn[actionType].required;
    optionalQty = this.currentTurn[actionType].optional;
  }

  if (requiredQty > 0) {
    this.currentTurn[action_type].required -= useAction ? 1 : 0;
    return true;
  }
  if (optionalQty > 0) {
    this.currentTurn[action_type].optional -= useAction ? 1 : 0;
    return true;
  }
  return requiredQty === -1 || optionalQty === -1;
};
PlayerSchema.methods.addAction = function(action) {
  // if there isn't any of this action already in the turn, create a dictionary for it
  if (!this.currentTurn[action.type]) {
    this.currentTurn[action.type] = {};
  }

  // check if the action is adding is required
  if (action.required) {
    if (this.currentTurn[action.type].required) {
      this.currentTurn[action.type].required += (action.qty);
    } else {
      this.currentTurn[action.type].required = (action.qty);
    }
  } else {
    if (this.currentTurn[action.type].optional) {
      this.currentTurn[action.type].optional += (action.qty);
    } else {
      this.currentTurn[action.type].optional = (action.qty);
    }
  }
};
PlayerSchema.methods.draw = function({ num }, game) {
  if (this.deck.cards.length < num || num === -1) {
    const shuffledDiscard = this.discard.shuffle();
    this.deck.card += shuffledDiscard;
    this.discardPile.cards = [];
  }

  const newHandCards = this.deck.cards.splice(0, num === -1 ? this.deck.cards.length : num);
  this.hand.cards += newHandCards;
  return game;
};
PlayerSchema.methods.discard = function({ index }, game) {
  if (index) {
    const discardCard = this.hand.cards.splice(index, 1);
    this.discardPile.cards.push(discardCard);
  } else {
    this.discardPile.cards += this.hand.cards;
    this.hand.cards = [];
  }
  return game;
};
PlayerSchema.methods.play = function({ index }, game) {
  const playCard = this.hand.cards[index];
  // get the actions from the card played (card at the index from the args in the player's hand)
  const actions = playCard.actions;
  // add the actions from the card to the current player's turn
  actions.forEach((action) => {
    this.addAction(action);
  });
  // if the card had actions, then we use an action from the current player's turn
  if (actions.length) {
    this.checkAction('play');
  }

  // add the buying power from the card to the players turn
  this.addAction(player['current_turn'],
    { 'type': 'buyingPower', 'required': false, 'qty': playCard.buyingPower || 0 });

  // set the card in the hand as played and update the player in the game
  this.hand.cards[index].played = true;
  return game;
};
PlayerSchema.methods.destroy = function({ index }, game) {
  const destroyCard = this.hand.cards.splice(index, 1);
  game.destroy.cards.push(destroyCard);
  return game;
};
PlayerSchema.methods.buy = function({ index }, game) {
  const buyCard = game.marketplace.cards[index];
  game.marketplace.cards[index].decreaseQty();
  this.discard.cards.push(buyCard);
  return game;
};

module.exports = { Player: mongoose.models.Player || mongoose.model('Player', PlayerSchema), PlayerSchema };
