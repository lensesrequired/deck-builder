require('dotenv').config();
const mongoose = require('mongoose');
const Deck = require('../../models/deck');

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
      Deck.findById(id, (err, deck) => {
        err ? res.send(err) : res.send(deck);
      });
      break;
    case 'PUT':
      Deck.replaceOne({ _id: id }, body, (err, deck) => {
        err ? res.send(err) : res.send(deck);
      });
      break;
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${ method } Not Allowed`);
  }
};
