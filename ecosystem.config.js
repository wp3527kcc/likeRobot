module.exports = {
    apps: [{
      name: "like-script",
      script: "./like.js",
      instances: 1,          // 启动2个进程
      exec_mode: "cluster",   // 集群模式
      max_memory_restart: "300M", // 内存超过300MB时重启
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      autorestart: true,
      watch: true,
      env: {
        PORT: 3000
      }
    }]
  };