require('dotenv').config();
const connectMongo = require('../../../../server');
const Game = require('../../../../models/game');
const { Player } = require('../../../../models/player');
const { Deck } = require('../../../../models/deck');

export default async (req, res) => {
  await connectMongo();
  const {
    query: { id },
    method
  } = req;

  switch (method) {
    case 'POST':
      try {
        Game.findById(id, async (err, game) => {
          err && res.send(err);
          game.players = [];
          let index = 0;
          for (const newPlayer of Array(game.settings.numPlayers)) {
            const startingCards = new Deck();
            startingCards.cards = await game.settings.startingDeck.cards.reduce(async (deck, card) => {
              deck = await deck;
              for (const newCard of Array(card.qty)) {
                await new Promise((r) => {
                  deck.push(card);
                  r();
                });
              }
              return deck;
            }, Promise.resolve([]));
            const startingDeck = startingCards.shuffle();
            const startingHand = startingDeck.splice(0, game.settings.handSize);

            index++;
            await new Promise((r) => {
              game.players.push(Player({
                name: `Player ${ index }`,
                deck: new Deck({ cards: startingDeck }),
                hand: new Deck({ cards: startingHand })
              }));
              r();
            });
          }
          game.currentPlayer = 0;
          game.save({}, (err, game) => {
            err ? res.send(err) : res.send(game);
          });
        });
      } catch (err) {
        console.log(err);
      }
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${ method } Not Allowed`);
  }
};
