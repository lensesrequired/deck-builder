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
