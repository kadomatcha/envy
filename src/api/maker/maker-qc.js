module.exports = function(app) {
    const axios = require('axios');
    const validator = require('validator');

    const colorMap = {
    putih: '#FFFFFF',
    hitam: '#000000',
    merah: '#FF0000',
    jingga: '#FF7F00',
    kuning: '#FFFF00',
    hijau: '#00FF00',
    biru: '#0000FF',
    nila: '#4B0082',
    ungu: '#8B00FF',
    red: '#FF0000',
    green: '#00FF00',
    blue: '#0000FF',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    yellow: '#FFFF00',
    keyblack: '#000000',
    oranye: '#FFA500',
    abu: '#808080',
    pink: '#FFC0CB',
    coklat: '#8B4513'
};

    app.get('/maker/qc', async (req, res) => {
        const { text, name, avatar, color } = req.query;

        if (!text || !name || !avatar || !color) {
            return res.status(400).json({
                status: false,
                error: 'Parameter text, name, avatar, and color required fields.'
            });
        }

        if (!validator.isURL(avatar)) {
            return res.status(400).json({
                status: false,
                error: 'avatar must be a valid URL.'
            });
        }

        const backgroundColor = colorMap[color.toLowerCase()];
        if (!backgroundColor) {
            return res.status(400).json({
                status: false,
                error: 'Invalid color. Use: merah, putih, hijau, biru, kuning, oranye, ungu, hitam.'
            });
        }

        try {
            const payload = {
                type: 'quote',
                format: 'png',
                backgroundColor,
                width: 512,
                height: 768,
                scale: 2,
                messages: [{
                    entities: [],
                    avatar: true,
                    from: {
                        id: 1,
                        name,
                        photo: { url: avatar }
                    },
                    text,
                    replyMessage: {}
                }]
            };

            const response = await axios.post(
                'https://bot.lyo.su/quote/generate',
                payload,
                { headers: { 'Content-Type': 'application/json' } }
            );

            const buffer = Buffer.from(response.data.result.image, 'base64');
            res.set('Content-Type', 'image/png');
            res.send(buffer);
        } catch (error) {
            res.status(500).json({
                status: false,
                error: error.message
            });
        }
    });
};
