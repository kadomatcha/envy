const axios = require('axios');

module.exports = function(app) {
    async function facebook(url) {
        const headers = {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0"
        };

        try {
            const response = await axios.get(url, { headers });
            const html = response.data;

            const title = html.match(/<meta name="description" content="([^"]+?)"/)?.[1] || null;
            const views = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1]
                ?.match(/([\d.,]+[ \u00A0]?[KM]?[ \u00A0]?(views|tayangan|vues))/i)?.[1] || null;
            const reaction = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1]
                ?.match(/([\d.,]+[ \u00A0]?[KM]?[ \u00A0]?r[eé]actions)/i)?.[1] || null;
            const video_sd = html.match(/"browser_native_sd_url":"(.+?)",/)?.[1]?.replace(/\\/g, "") || null;
            const video_hd = html.match(/"browser_native_hd_url":"(.+?)",/)?.[1]?.replace(/\\/g, "") || null;
            const audio = html.match(/"mime_type":"audio\\\/mp4","codecs":"mp4a\.40\.5","base_url":"(.+?)",/)?.[1]?.replace(/\\/g, "") || null;

            return { title, views, reaction, video_sd, video_hd, audio };
        } catch (error) {
            console.error("Error fetching Facebook data:", error);
            throw error;
        }
    }

    app.get('/downloader/facebook', async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) {
                return res.status(400).json({ status: false, error: 'Url is required parameter' });
            }

            const result = await facebook(url);
            res.status(200).json({ status: true, result });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
