require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const validator = require('validator');
app.use(express.json());
const mongoose = require('mongoose');
const UrlMapping = require('./models/UrlMapping');

const mongoDBUri = 'mongodb+srv://catsmeow5776:ezpassword@cluster0.pevcdhd.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(mongoDBUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (error) => {
  console.error(`Error connecting to MongoDB: ${error.message}`);
});

db.once('open', () => {
  console.log('Connected to MongoDB');
});

function createShortUrl() {
  return Date.now().toString(36);
}

async function saveUrlToDatabase(shortUrl, originalUrl) {
  const urlMapping = new UrlMapping({ shortUrl, originalUrl });

  try {
    await urlMapping.save();
    console.log('URL mapping saved:', urlMapping);
  } catch (error) {
    console.error(`Error saving URL mapping: ${error.message}`);
    throw error;
  }
}

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.get('/api/shorturl/:shortUrl', async (req, res) => {
  const shortUrl = req.params.shortUrl;
  const originalUrl = await findOriginalUrl(shortUrl);
  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.status(404).json({ error: 'Short URL not found' });
  }
});

// Post route to handle URL submissions from the frontend
app.post('/api/shorturl/new', async (req, res) => {
  // Get the submitted URL from the request body
  const submittedUrl = req.body.url;

  // Validate the submitted URL
  const validUrl = validator.isURL(submittedUrl, { require_protocol: true });


  // If the URL is valid, create a new short URL
  if (validUrl) {
    try {
      // Create a new short URL
      const newShortUrl = createShortUrl();

      // Save the new short URL to the database
      await saveUrlToDatabase(newShortUrl, submittedUrl);

      // Send the new short URL back to the frontend
      res.json({ original_url: submittedUrl, short_url: newShortUrl });
    } catch (error) {
      // Handle any errors that occur during URL storage
      console.error(`Error saving URL to the database: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  // If the URL is not valid, send an error message back to the frontend
  else {
    res.status(400).json({ error: 'Invalid URL' });
  }
});

async function findOriginalUrl(shortUrl) {
  try {
    const urlMapping = await UrlMapping.findOne({ shortUrl });
    if (urlMapping) {
      return urlMapping.originalUrl;
    }
  } catch (error) {
    console.error(`Error finding original URL for short URL ${shortUrl}: ${error.message}`);
  }
  return null;
}

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

