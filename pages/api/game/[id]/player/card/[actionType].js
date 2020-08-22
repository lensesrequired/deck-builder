require('dotenv').config();
const getConnection = require('../../../../../../server');
const Game = require('../../models/game');
const Player = require('../../models/player');

getConnection('mongo');
export default (req, res) => {
  const {
    query: { id, actionType, index, num },
    method
  } = req;

  switch (method) {
    case 'POST':
      Game.findById(id, (err, game) => {
        err && res.send(err);
        const { currentPlayer } = game;
        const player = new Player(game.players[currentPlayer]);
        if (player.checkAction(actionType, actionType !== 'play')) {
          game = player[actionType]({ index, num }, game);
        } else {
          //TODO: Throw error
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