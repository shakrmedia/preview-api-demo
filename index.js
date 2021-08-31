require('dotenv').config();

const express = require('express');

const ShakrAPI = require('./lib/shakr-api');
const generateCertificate = require('./lib/certificate');

const options = generateCertificate();
const app = express();
const port = process.env.PORT || 3000;
const SHAKR_RENDER_CALLBACK_SIGNATURE_HEADER = 'x-shakr-signature';

const shakrAPI = new ShakrAPI({
    base_url: process.env.SHAKR_BASE_URL,
    client_id: process.env.SHAKR_CLIENT_ID,
    client_secret: process.env.SHAKR_CLIENT_SECRET
});


// Pare body as raw text for webhook signature calculation
app.use(express.json({
    verify: (req, _, buffer, encoding) => {
        if (!req.get(SHAKR_RENDER_CALLBACK_SIGNATURE_HEADER)) {
            return;
        }

        if (buffer && buffer.length) {
            req.raw_body = buffer.toString(encoding || 'utf-8');
        }
    }
}));

app.get('/', async (req, res) => {
    res.status(200).send('Hello World!');
});

app.post('/api/videos', async (req, res) => {
    const video_id = await shakrAPI.createVideo(
        process.env.SHAKR_TEMPLATE_STYLE_VERSION_ID,
        req.body
    );

    // TODO: Persist video_id to your database for
    // validation when webhook from Shakr is delivered to
    // your desired endpoint.

    console.log(`Video (${video_id}) created`);
    res.json({ video_id: video_id });
});

app.post('/api/videos/webhook', async (req, res) => {
    const signature = req.get(SHAKR_RENDER_CALLBACK_SIGNATURE_HEADER);

    if(
        !signature ||
        !req.raw_body ||
        !shakrAPI.verifySignature(signature, req.raw_body)
    ) {
        console.log('Webhook signature validation failed');
        res.status(200).send();
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


