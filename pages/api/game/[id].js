require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('../../models/game');

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true
});
export default handler = (req, res) => {
  const {
    query: { id },
    body,
    method
  } = req;

  switch (method) {
    case 'GET':
      Game.findById(id, (err, game) => {
        err ? res.send(err) : res.send(game);
      });
      break;
    case 'PATCH':
      Game.updateOne({ _id: id }, body, (err, game) => {
        err ? res.send(err) : res.send(game);
      });
      break;
    case 'POST':
      const newGame = new Game({ deckId: id });
      newGame.save({}, (err, game) => {
        err ? res.send(err) : res.send(game);
      });
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
      res.status(405).end(`Method ${ method } Not Allowed`);
  }
};
