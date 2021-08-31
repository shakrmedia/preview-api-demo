require('dotenv').config();

const express = require('express');
const ShakrAPI = require('./lib/shakr-api');
const generateCertificate = require('./lib/certificate');

const options = generateCertificate();
const app = express();
const port = process.env.PORT || 3000;

const shakrAPI = new ShakrAPI({
    base_url: process.env.SHAKR_BASE_URL,
    client_id: process.env.SHAKR_CLIENT_ID,
    client_secret: process.env.SHAKR_CLIENT_SECRET
});

app.use(express.text({ type: '*/*' }));

app.get('/', async (req, res) => {
    res.status(200).send('Hello World!');
});

app.post('/api/videos', async (req, res) => {
    const video_id = await shakrAPI.createVideo(
        SHAKR_TEMPLATE_STYLE_VERSION_ID,
        req.body
    );

    res.json({ video_id: video_id });
});

require('https').createServer(options, app).listen(port, () => {
    console.log(`HTTPS server started at https://localhost:${port}`);
});

app.post('/api/videos/webhook', async (req, res) => {
    const signature = req.get('X-Shakr-Signature');

    if(!shakrAPI.verifySignature(signature, req.body)) {
        console.log('Webhook signature validation failed');
        return res.status(422).send();
    }

    res.status(200).send('bye');
});
