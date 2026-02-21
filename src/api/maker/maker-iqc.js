module.exports = function(app) {
    const axios = require('axios');
    app.get('/maker/iqc', async (req, res) => {
        const { text } = req.query;
        if (!text) {
            return res.status(400).json({ status: false, error: 'Text is required' });
        }
        try {
            const api1 = `https://api.nexray.web.id/maker/iqc?text=${encodeURIComponent(text)}`;
            const response = await axios.get(api1, { responseType: 'arraybuffer' });
            res.set('Content-Type', 'image/png');
            res.send(response.data);
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
}
