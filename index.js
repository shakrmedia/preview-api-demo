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

// Store raw body for webhook signature calculation
// Naive implementation; not intended for production use
app.use((req, res, next) => {
    var data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => data += chunk);
    req.on('end', () => req.rawBody = data);
    next();
});

app.use(express.json());

app.get('/', async (req, res) => {
    res.status(200).send('Hello World!');
});

app.post('/api/videos', async (req, res) => {
    console.log(req.body);

    const video_id = await shakrAPI.createVideo(
        process.env.SHAKR_TEMPLATE_STYLE_VERSION_ID,
        req.body
    );

    // TODO: Persist video_id to your database for
    // validation when webhook from Shakr is delivered to
    // your desired endpoint.

    res.json({ video_id: video_id });
});

app.post('/api/videos/webhook', async (req, res) => {
    const signature = req.get('X-Shakr-Signature');

    if(!shakrAPI.verifySignature(signature, req.body_raw || '')) {
        console.log('Webhook signature validation failed');
        res.status(422).send();
        return;
    }

    const { video_id, event, output_url } = req.body;

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


