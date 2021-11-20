require('dotenv').config();
const connectMongo = require('../../../../../server');
const Game = require('../../../../../models/game');
const { Player } = require('../../../../../models/player');

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
        const { currentPlayer } = game;
        game.players[currentPlayer] = new Player(game.players[currentPlayer]).startTurn(game.settings);

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
