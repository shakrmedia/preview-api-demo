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
    const json_body = JSON.parse(req.body);

    const video_id = await shakrAPI.createVideo(
        SHAKR_TEMPLATE_STYLE_VERSION_ID,
        req.body
    );

    // TODO: Persist video_id to your database for
    // validation when webhook from Shakr is delivered to
    // your desired endpoint.

    res.json({ video_id: video_id });
});

app.post('/api/videos/webhook', async (req, res) => {
    const signature = req.get('X-Shakr-Signature');

    if(!shakrAPI.verifySignature(signature, req.body)) {
        console.log('Webhook signature validation failed');
        res.status(422).send();
        return;
    }

    const json_body = JSON.parse(req.body);
    const { video_id, event, output_url } = json_body;

    if(event === 'finish') {
        // TODO: Video is successfully rendered, handle completion
    } else if(event === 'fail') {
        // TODO: Video rendering failed, handle failure
    } else {
        // TODO: Skip processing for unknown events
    }

    res.status(200).send();
});

require('https').createServer(options, app).listen(port, () => {
    console.log(`HTTPS server started at https://localhost:${port}`);
});


