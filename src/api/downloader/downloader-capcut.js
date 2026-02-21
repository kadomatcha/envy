const axios = require('axios');

module.exports = function(app) {
    async function fetchCapcutVideo(url) {
        try {
            const headers = {
                accept: 'application/json, text/plain, */*',
                'accept-encoding': 'gzip, deflate, br',
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'referer': 'https://www.capcut.com/',
                'origin': 'https://www.capcut.com'
            };
            const response = await axios.post('https://3bic.com/api/download', { url }, { headers });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    app.get('/downloader/capcut', async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) {
                return res.status(400).json({ status: false, error: 'Url is required parameter' });
            }

            const data = await fetchCapcutVideo(url);

            const base64url = data.originalVideoUrl.split('/api/cdn/')[1];
            const video = Buffer.from(base64url, 'base64').toString();

            res.status(200).json({
                status: true,
                result: {
                    title: data.title,
                    author: data.authorName,
                    thumbnail: data.coverUrl,
                    url: video
                }
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
