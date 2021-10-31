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
          console.log(game);
          game.players = Array(game.settings.numPlayers).map(async (player, index) => {
            const startingCards = new Deck();
            startingCards.cards = await game.settings.startingDeck.cards.reduce(async (deck, card) => {
              deck = await deck;
              await new Promise((resolve) => {
                Array(card.qty).forEach(() => {
                  deck.push(card);
                });
                resolve();
              });
              console.log(deck);
              return deck;
            }, Promise.resolve([]));
            startingCards.shuffle();
            const startingHand = startingCards.cards.splice(0, game.settings.handSize);

            return new Player({
              name: `Player ${ index }`,
              deck: new Deck({ cards: startingCards }),
              hand: new Deck({ cards: startingHand })
            });
          });
          game.currentPlayer = 0;
          console.log(game);
          // game.save({}, (err, game) => {
          //   err ? res.send(err) : res.send(game);
          // });
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
