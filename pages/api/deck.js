require('dotenv').config();
const getConnection = require('../../server');
const Deck = require('../../models/deck');

getConnection('mongo');
export default (req, res) => {
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
