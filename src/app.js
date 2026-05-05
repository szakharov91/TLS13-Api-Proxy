const express = require('express');
const axios = require('axios');

function createApp(clientKeys) {
  const app = express();

  app.use(express.json());

  app.use((req, res, next) => {
    const key = req.headers['x-client-api-key'];
    if (!key || !clientKeys.includes(key)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });

  app.post('/', async (req, res) => {
    try {
      const requestUrl = req.headers['x-target-url'];
      if (!requestUrl) {
        return res.status(400).json({ error: 'Missing X-Target-URL header' });
      }

      const response = await axios.post(
        requestUrl,
        req.body,
        {
          headers: {
            Authorization: req.headers.authorization,
            'Content-Type': 'application/json',
            'Accept': '*/*'
          }
        }
      );

      res.status(response.status).json(response.data);
    } catch (err) {
      if (err.response) {
        res.status(err.response.status).json(err.response.data);
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  });

  return app;
}

module.exports = createApp;
