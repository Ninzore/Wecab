module.exports = {
    apps: [
        {
            name: 'wecab',
            script: 'index.js',
            time: true,
            instances: 1,
            autorestart: true,
            max_restarts: 5,
            min_uptime: '10s',
            restart_delay: 5000,
            watch: ['config.json'],
            out_file: './logs/normal.log',
            error_file: './logs/error.log',
        },
    ],
};
