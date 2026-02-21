const { igdl } = require('btch-downloader');

module.exports = function(app) {
    app.get('/downloader/instagram', async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) {
                return res.status(400).json({ status: false, error: 'Url is required parameter' });
            }

            const data = await igdl(url);
            
            // Menghapus properti 'creator' dari setiap item di array result
            const result = data.map(item => ({
                thumbnail: item.thumbnail,
                url: item.url
            }));

            res.status(200).json({
                status: true,
                result
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
