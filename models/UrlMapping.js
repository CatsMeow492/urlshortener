const mongoose = require('mongoose');

const urlMappingSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('UrlMapping', urlMappingSchema);
