const axios = require('axios');
const moment = require('moment-timezone');

async function tiktok(url) {
  try {
    const params = new URLSearchParams();
    params.set("url", url);
    params.set("hd", "1");

    const response = await axios({
      method: "POST",
      url: "https://tikwm.com/api/",
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://www.tikwm.com',
        'Referer': 'https://www.tikwm.com/',
        'Sec-Ch-Ua': '"Not)A;Brand";v="24", "Chromium";v="116"',
        'Sec-Ch-Ua-Mobile': '?1',
        'Sec-Ch-Ua-Platform': 'Android',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      },
      data: params
    });

    const data = response.data.data;

    function formatNumber(integer) {
      const numb = parseInt(integer);
      if (numb >= 1_000_000) {
        return (numb / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
      } else if (numb >= 1_000) {
        return (numb / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
      }
      return numb.toLocaleString().replace(/,/g, '.');
    }

    const postedAt = moment.tz((data.create_time || '0') * 1000, 'Asia/Jakarta');
    const formattedPostedAt = postedAt.format('DD/MM/YYYY HH:mm:ss');
      
    let contentData;
    if (data.images) {
      contentData = data.images;
    } else {
      contentData = data.play || data.hdplay || data.wmplay;
    }

    return {
      title: data.title || '-',
      taken_at: formattedPostedAt,
      region: data.region || '-',
      id: data.id || '-',
      duration: (data.duration || 0) + ' seconds',
      cover: data.cover || '-',
      size_wm: data.wm_size || '0',
      size_nowm: data.size || '0',
      size_nowm_hd: data.hd_size || '0',
      data: contentData,
      music_info: {
        id: data.music_info.id || '-',
        title: data.music_info.title || '-',
        author: data.music_info.author || '-',
        album: data.music_info.album || '-',
        duration: (data.music_info.duration || 0) + ' seconds',
        original: data.music_info.original ? 'Yes' : 'No',
        copyright: data.music_info.copyright ? 'Yes' : 'No',
        url: data.music || data.music_info.play || data.music_info.cover || 'https://files.catbox.moe/uouck4.mp3',
      },
      stats: {
        views: formatNumber(data.play_count) || '0',
        likes: formatNumber(data.digg_count) || '0',
        comment: formatNumber(data.comment_count) || '0',
        share: formatNumber(data.share_count) || '0',
        save: formatNumber(data.collect_count) || '0',
        download: formatNumber(data.download_count) || '0'
      },
      author: {
        id: data.author.id || '-',
        fullname: data.author.unique_id || '-',
        nickname: data.author.nickname || '-',
        avatar: data.author.avatar
      }
    };
  } catch (error) {
    console.error("Error fetching TikTok data:", error);
    throw error;
  }
}

module.exports = function (app) {
  app.get('/downloader/tiktok', async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) {
        return res.status(400).json({ status: false, error: 'URL adalah parameter wajib' });
      }
      const result = await tiktok(url);
      res.status(200).json({
        status: true,
        result
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
};
