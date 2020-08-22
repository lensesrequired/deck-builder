require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('../../models/game');
const Player = require('../../models/player');

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true
});
export default handler = (req, res) => {
  const {
    query: { id },
    method
  } = req;

  switch (method) {
    case 'POST':
      Game.findById(id, (err, game) => {
        err && res.send(err);
        const { currentPlayer } = game;
        const player = new Player(game.players[currentPlayer]);
        if (player.isTurnFinished()) {
          game.players[currentPlayer] = player.endTurn(game.settings);
        }
        game.currentPlayer = (game.currentPlayer + 1) % game.settings.numPlayers;
        if (game.currentPlayer === 0) {
          game.numTurns += 1;
        }

        if (game.isOver()) {
          game.calculateStats();
        }

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
