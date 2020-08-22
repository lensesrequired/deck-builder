require('dotenv').config();
const mongoose = require('mongoose');
const Deck = require('../../models/deck');

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true
});
export default handler = (req, res) => {
  const {
    method
  } = req;

  switch (method) {
    case 'POST':
      const newDeck = new Deck();
      newDeck.save({}, (err, deck) => {
        err ? res.send(err) : res.send(deck);
      });
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${ method } Not Allowed`);
  }
};
