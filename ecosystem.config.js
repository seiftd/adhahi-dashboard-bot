export default {
  apps: [
    {
      name: 'adhahi-dashboard-bot',
      script: 'server/src/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '700M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HEADLESS: 'true'
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      time: true
    }
  ]
};
