require('dotenv').config();
const connectMongo = require('../../../../../../server');
const Game = require('../../../../../../models/game');
const { Player } = require('../../../../../../models/player');

export default async (req, res) => {
  await connectMongo();
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
        const currentTurn = player.checkAction(actionType, actionType !== 'play');
        let updatedPlayer = player;
        if (currentTurn) {
          updatedPlayer = player[actionType]({ index, num }, game);
        } else {
          return res.status(403).send({ message: 'Action not allowed' });
        }

        console.log(game.players[0].currentTurn);
        game.players[currentPlayer] = updatedPlayer;
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
