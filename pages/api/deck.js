require('dotenv').config();
const connectMongo = require('../../server');
const { Deck } = require('../../models/deck');

export default async (req, res) => {
  await connectMongo();
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
