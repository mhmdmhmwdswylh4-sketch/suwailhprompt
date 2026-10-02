module.exports = {
  apps: [
    {
      name: "suwailih",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0 -p 3000",
      env: { NODE_ENV: "production", NODE_OPTIONS: "--max-old-space-size=512" },
      watch: false,
      instances: 1,
      exec_mode: "fork",
    },
  ],
};
