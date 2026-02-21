const os = require('os'); // Untuk informasi RAM dan sistem
const axios = require('axios'); // Untuk panggilan API eksternal

module.exports = function(app) {
    // Inisialisasi total permintaan, waktu mulai, dan metrik lainnya
    app.locals.totalRequests = app.locals.totalRequests || 0;
    app.locals.responseTimes = app.locals.responseTimes || []; // Menyimpan waktu respons
    app.locals.routeStatus = app.locals.routeStatus || {}; // Menyimpan status rute (sukses/gagal)
    const startTime = Date.now();

    // Middleware untuk menghitung semua permintaan dan metrik
    app.use((req, res, next) => {
        const requestStart = Date.now();
        app.locals.totalRequests++;

        // Menangkap waktu respons dan status rute
        res.on('finish', () => {
            const duration = Date.now() - requestStart;
            app.locals.responseTimes.push(duration);
            const routePath = req.route ? req.route.path : req.path;
            if (routePath) {
                app.locals.routeStatus[routePath] = app.locals.routeStatus[routePath] || { success: 0, error: 0 };
                if (res.statusCode === 200) {
                    app.locals.routeStatus[routePath].success++;
                } else if (res.statusCode >= 500) {
                    app.locals.routeStatus[routePath].error++;
                }
                // Status 400 diabaikan (tidak dihitung sebagai sukses atau error)
            }
        });
        next();
    });

    // Format runtime ke jam, menit, detik
    function formatRuntime() {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(seconds / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const remainingSeconds = seconds % 60;

        const parts = [];
        if (hours > 0) parts.push(`${hours}j`);
        if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
        parts.push(`${remainingSeconds.toString().padStart(2, '0')}s`);

        return parts.join(' ');
    }

    // Hitung total rute
    function getTotalRoutes() {
        return app._router.stack.filter(layer => layer.route).length;
    }

    // Mendapatkan kode wilayah server (contoh: "US")
    async function getServerRegion() {
        const response = await axios.get('https://ipapi.co/json/');
        return response.data.country_code;
    }

    // Format ukuran RAM ke MB, GB, atau TB secara dinamis
    function formatRam(bytes) {
        const units = ['MB', 'GB', 'TB'];
        let value = bytes / (1024 * 1024); // Konversi ke MB
        let unitIndex = 0;

        if (value >= 1024) {
            value /= 1024; // Konversi ke GB
            unitIndex++;
        }
        if (value >= 1024) {
            value /= 1024; // Konversi ke TB
            unitIndex++;
        }

        return `${value.toFixed(2)} ${units[unitIndex]}`;
    }

    // Mendapatkan informasi RAM
    function getRamInfo() {
        const totalRam = os.totalmem();
        const freeRam = os.freemem();
        const usedRam = totalRam - freeRam;

        return {
            total_ram: formatRam(totalRam),
            used_ram: formatRam(usedRam),
            free_ram: formatRam(freeRam)
        };
    }

    // Mengukur kecepatan server (latensi) tanpa timeout
    async function getServerSpeed() {
        const start = Date.now();
        await axios.get('https://www.google.com');
        const latency = Date.now() - start;
        return `${latency} ms`;
    }

    // Menghitung rata-rata waktu respons
    function getAverageResponseTime() {
        const times = app.locals.responseTimes;
        if (times.length === 0) return '0 ms';
        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
        return `${Math.floor(avg)} ms`; // Tanpa desimal
    }

    // Menghitung success rate dan error rate berdasarkan fitur (rute)
    function getRequestMetrics() {
        const totalRoutes = getTotalRoutes();
        if (totalRoutes === 0) {
            return { success_rate: '0.00%', error_rate: '0.00%' };
        }

        let successCount = 0;
        let errorCount = 0;
        for (const route in app.locals.routeStatus) {
            if (app.locals.routeStatus[route].success > 0) {
                successCount++;
            }
            if (app.locals.routeStatus[route].error > 0) {
                errorCount++;
            }
        }

        const successRate = (successCount / totalRoutes) * 100;
        const errorRate = (errorCount / totalRoutes) * 100;
        return {
            success_rate: `${successRate.toFixed(2)}%`,
            error_rate: `${errorRate.toFixed(2)}%`
        };
    }

    // Endpoint /api/status
    app.get('/api/status', async (req, res) => {
        try {
            const domain = req.headers.host;
            const region = await getServerRegion();
            const ramInfo = getRamInfo();
            const speed = await getServerSpeed();
            const metrics = getRequestMetrics();
            const response_time = getAverageResponseTime();

            res.status(200).json({
                status: true,
                result: {
                    status: 'Active',
                    totalrequest: app.locals.totalRequests.toString(),
                    totalfitur: getTotalRoutes(),
                    runtime: formatRuntime(),
                    speed: speed,
                    response_time: response_time,
                    success_rate: metrics.success_rate,
                    error_rate: metrics.error_rate,
                    region: region,
                    domain: domain,
                    total_ram: ramInfo.total_ram,
                    used_ram: ramInfo.used_ram,
                    free_ram: ramInfo.free_ram
                }
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                error: error.message
            });
        }
    });
};
