const crypto = require('crypto');
const fetch = require('node-fetch');

module.exports = class ShakrAPI {
    constructor({ base_url, client_id, client_secret }) {
        this.base_url = base_url;
        this.client_id = client_id;
        this.client_secret = client_secret;

        this.access_token = null;
    }

    get access_token_header() {
        return this.access_token ?
            { 'Authorization': `Bearer ${this.access_token}` } :
            {};
    }

    async authorize() {
        if (this.access_token) {
            return;
        }

        const res = await fetch(
            'https://api.shakr.com/oauth/token',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: this.client_id,
                    client_secret: this.client_secret,
                    grant_type: 'client_credentials'
                })
            }
        );

        let json = await res.json();
        this.access_token = json.access_token;
    }

    async createVideo(template_style_version_id, resources) {
        await this.authorize();

        const res = await this._request({
            url: '/v3/videos',
            method: 'POST',
            body: {
                title: 'My Example Shakr Video',
                mapping: {
                    template_style_version_id,
                    resources
                }
            }
        });

        return res.id;
    }

    verifySignature(signature, body_raw) {
        const calculated_signature = crypto.createHmac(
            'sha256',
            this.client_id
        ).update(body_raw, 'utf-8').digest('hex');

        const calculated_signature_str = `sha256=${calculated_signature}`;

        if(
            signature === undefined ||
            signatured.length !== calculated_signature.length
        ) { return false; }

        return crypto.timingSafeEqual(
            Buffer.from(signature, 'utf-8'),
            Buffer.from(calculated_signature_str, 'utf-8')
        );
    }

    async _request({ url, method, body }) {
        const res = await fetch(
            `${this.base_url}${url}`,
            {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...this.access_token_header
                },
                body: JSON.stringify(body)
            }
        );

        return await res.json();
    }
}
