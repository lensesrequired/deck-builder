require('dotenv').config();
const mongoose = require('mongoose');

const connections = {};

const connectionTypes = {
  mongo: () => mongoose.connect(encodeURI(process.env.MONGO_URL), {
    useNewUrlParser: true, useUnifiedTopology: true
  })
};

const getConnection = async (type) => {
  if (!connections[type]) {
    connections[type] = await connectionTypes[type]();
  }
  return connections[type];
};

module.exports = getConnection;
