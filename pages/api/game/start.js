require('dotenv').config();
const connectMongo = require('../../../server');
const Game = require('../../models/game');
const Player = require('../../models/player');
const Deck = require('../../models/deck');

export default async (req, res) => {
  await connectMongo();
  const {
    query: { id },
    method
  } = req;

  switch (method) {
    case 'POST':
      Game.findById(id, (err, game) => {
        err && res.send(err);
        game.players = Array(game.settings.numPlayers).map((player, index) => {
          const startingCards = new Deck(game.settings.startingDeck).shuffle();
          const startingHand = startingCards.splice(0, game.settings.handSize);

          return new Player({
            name: `Player ${ index }`,
            deck: new Deck({ cards: startingCards }),
            hand: new Deck({ cards: startingHand })
          });
        });
        game.currentPlayer = 0;
        game.save({}, (err, game) => {
          err ? res.send(err) : res.send(game);
        });
      });
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${ method } Not Allowed`);
  }
};
