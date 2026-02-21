const axios = require('axios');
module.exports = function(app) {
    async function pap() {
        try {
            const response = await axios.get('https://files.catbox.moe/e3pms2.jpg', { responseType: 'arraybuffer' });
            return Buffer.from(response.data);
        } catch (error) {
            throw error;
        }
    }
    app.get('/random/pap', async (req, res) => {
        try {
            const pedo = await pap();
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': pedo.length,
            });
            res.end(pedo);
        } catch (error) {
            res.status(500).send(`Error: ${error.message}`);
        }
    });
};
