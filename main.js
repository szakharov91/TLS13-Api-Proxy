const express = require('express');
const axios = require('axios');
const config = require('./config');

const app = express();
const PORT = config.port || 5555;

// чтобы читать JSON из тела запроса
app.use(express.json());

app.post('/esia', async (req, res) => {
  try {

    const requestUrl = req.headers['x-target-url'];
    if (!requestUrl) {
      return res.status(400).json({ error: 'Missing X-Target-URL header' });
    }

    const response = await axios.post(
      requestUrl,
      req.body, // проксируем тело как есть
      {
        headers: {
          Authorization: req.headers.authorization, // пробрасываем токен
          'Content-Type': 'application/json',
          'Accept': '*/*'
        }
      }
    );

    res.status(response.status).json(response.data);
  } catch (err) {
    if (err.response) {
      // если API вернул ошибку — пробрасываем её
      res.status(err.response.status).json(err.response.data);
    } else {
      // если что-то пошло не так на уровне сети
      res.status(500).json({ error: err.message });
    }
  }
});

    app.listen(PORT, () => {
    console.log('Proxy running on http://localhost:' + PORT);
});