require('dotenv').config();
const getConnection = require('../../../server');
const Deck = require('../../../models/deck');

getConnection('mongo');
export default (req, res) => {
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
