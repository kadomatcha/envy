module.exports = function(app) {
    const axios = require('axios');

    app.get('/maker/smeme', async (req, res) => {
        const { text_atas, text_bawah, background } = req.query;
        
        if (!text_atas && !text_bawah) {
            return res.status(400).json({ status: false, error: 'The text-top or text-bottom parameter must be filled' });
        }

        let url = 'https://api.memegen.link/images/custom';
        const atas = text_atas ? encodeURIComponent(text_atas) : ' ';
        const bawah = text_bawah ? encodeURIComponent(text_bawah) : ' ';
        url += `/${atas}/${bawah}.png`;

        if (background) {
            url += `?background=${encodeURIComponent(background)}`;
        }

        try {
            const response = await axios.get(url, {
                headers: { 'Content-Type': 'application/json' },
                responseType: 'arraybuffer'
            });

            res.set('Content-Type', 'image/png');
            res.send(response.data);
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};