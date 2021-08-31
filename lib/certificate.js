const selfsigned = require('selfsigned');

module.exports = function generateCertificate() {
    const pem = selfsigned.generate(
        [{ name: 'commonName', value: 'localhost' }],
        {
            algorithm: 'sha256',
            keySize: 2048,
            days: 30,
            extensions: [
                {
                    name: 'keyUsage',
                    keyCertSign: true,
                    digitalSignature: true,
                    nonRepudiation: true,
                    keyEncipherment: true,
                    dataEncipherment: true,
                },
                {
                    name: 'extKeyUsage',
                    serverAuth: true,
                    clientAuth: true,
                    codeSigning: true,
                    timeStamping: true,
                },
                {
                    name: 'subjectAltName',
                    altNames: [
                        {
                            // type 2 is DNS
                            type: 2,
                            value: 'localhost',
                        },
                        {
                            // type 7 is IP
                            type: 7,
                            ip: '127.0.0.1',
                        }
                    ],
                },
            ]
        }
    );

    return {
        key: pem.private,
        cert: pem.cert
    };
};
