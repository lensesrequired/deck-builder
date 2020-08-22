require('dotenv').config();
const connectMongo = require('../../../server');
const Deck = require('../../../models/deck');

export default async (req, res) => {
  await connectMongo();
  const {
    query: { id },
    body,
    method
  } = req;

  return new Promise((resolve) => {
    switch (method) {
      case 'GET':
        Deck.findById(id, (err, deck) => {
          if (err || !deck) {
            res.status(!deck ? 404 : 500).send(err);
            resolve();
          }
          res.status(200).send(deck);
          resolve();
        });
        break;
      case 'PUT':
        Deck.replaceOne({ _id: id }, body, (err, deck) => {
          err ? res.status(500).send(err) : res.send(deck);
          resolve();
        });
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        res.status(405).end(`Method ${ method } Not Allowed`);
    }
  });
};
