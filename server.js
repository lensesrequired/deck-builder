require('dotenv').config();
const mongoose = require('mongoose');

const connectMongo = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }
  await mongoose.connect(encodeURI(process.env.MONGO_URL), {
    useNewUrlParser: true, useUnifiedTopology: true
  });
};

module.exports = connectMongo;
