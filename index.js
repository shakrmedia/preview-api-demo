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


// Pare body as raw text for webhook signature calculation
app.use(express.text({ 'type': '*/*' }));
app.use((req, res, next) => {
    // express.text() returns empty object ({}) when body is empty or invalid
    req.body_str = (typeof req.body === "string") ? req.body : "";

    try {
        req.body_json = JSON.parse(req.body_str);
    } catch(_e) {
        req.body_json = {};
    }

    next();
});

app.get('/', async (req, res) => {
    res.status(200).send('Hello World!');
});

app.post('/api/videos', async (req, res) => {
    const video_id = await shakrAPI.createVideo(
        process.env.SHAKR_TEMPLATE_STYLE_VERSION_ID,
        req.body_json
    );

    // TODO: Persist video_id to your database for
    // validation when webhook from Shakr is delivered to
    // your desired endpoint.

    console.log(`Video (${video_id}) created`);
    res.json({ video_id: video_id });
});

app.post('/api/videos/webhook', async (req, res) => {
    const signature = req.get('X-Shakr-Signature');

    if(
        signature === undefined ||
        req.body_str === "" ||
        !shakrAPI.verifySignature(signature, req.body_str)
    ) {
        console.log('Webhook signature validation failed');
        res.status(200).send();
        return;
    }

    const { video_id, event, output_url } = req.body_json;

    if(event === 'finish') {
        console.log(`Received finish event for video ${video_id}`);
        // TODO: Video is successfully rendered, handle completion
    } else if(event === 'fail') {
        console.log(`Received fail event for video ${video_id}`);
        // TODO: Video rendering failed, handle failure
    } else {
        console.log('Received unknown webhook');
        // TODO: Skip processing for unknown events
    }

    res.status(200).send();
});

require('https').createServer(options, app).listen(port, () => {
    console.log(`HTTPS server started at https://localhost:${port}`);
});


