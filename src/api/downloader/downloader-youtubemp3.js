const axios = require('axios');
const crypto = require('crypto');

module.exports = function(app) {
    class Savetube {
        constructor() {
            this.ky = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
            this.hr = {
                'content-type': 'application/json',
                'origin': 'https://yt.savetube.me',
                'user-agent': 'Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0'
            };
            this.fmt = ['144', '240', '360', '480', '720', '1080', 'mp3'];
            this.m = /^((?:https?:)?\/\/)?((?:www|m|music)\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([a-zA-Z0-9_-]{11})/;
        }

        async decrypt(enc) {
            try {
                const [sr, ky] = [Buffer.from(enc, 'base64'), Buffer.from(this.ky, 'hex')];
                const [iv, dt] = [sr.slice(0, 16), sr.slice(16)];
                const dc = crypto.createDecipheriv('aes-128-cbc', ky, iv);
                return JSON.parse(Buffer.concat([dc.update(dt), dc.final()]).toString());
            } catch (e) {
                throw new Error(`Error while decrypting data: ${e.message}`);
            }
        }

        async getCdn() {
            const response = await axios.get("https://media.savetube.me/api/random-cdn", { headers: this.hr });
            if (!response.status) return response;
            return {
                status: true,
                data: response.data.cdn
            };
        }

        async download(url, format = 'mp3') {
            const id = url.match(this.m)?.[3];
            if (!id) {
                throw new Error("ID cannot be extracted from URL");
            }
            if (!format || !this.fmt.includes(format)) {
                throw new Error(`Format not found. Available formats: ${this.fmt.join(', ')}`);
            }
            const u = await this.getCdn();
            if (!u.status) throw new Error("Failed to fetch CDN");
            const res = await axios.post(`https://${u.data}/v2/info`, {
                url: `https://www.youtube.com/watch?v=${id}`
            }, { headers: this.hr });
            const dec = await this.decrypt(res.data.data);
            const dl = await axios.post(`https://${u.data}/download`, {
                id: id,
                downloadType: format === 'mp3' ? 'audio' : 'video',
                quality: format === 'mp3' ? '128' : format,
                key: dec.key
            }, { headers: this.hr });

            return {
                title: dec.title,
                format: format,
                thumbnail: dec.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
                duration: dec.duration,
                url: dl.data.data.downloadUrl
            };
        }
    }

    const savetube = new Savetube();

    app.get('/downloader/ytmp3', async (req, res) => {
        try {
            const { url, format = 'mp3' } = req.query; // Default format to 'mp3'
            if (!url) {
                return res.status(400).json({ status: false, error: 'URL is required parameter' });
            }
            const result = await savetube.download(url, format);
            res.status(200).json({
                status: true,
                result
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
