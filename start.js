#!/usr/bin/env node

const { exec, spawn } = require("child_process");

// 执行 npm install 命令
exec("npm run install", (error, stdout, stderr) => {
  if (error) {
    // 如果有错误，打印错误并退出
    console.error(`执行出错: ${error}`);
    process.exit(1);
  }
  if (stderr) {
    // 如果有标准错误输出，打印它
    console.error(`标准错误输出: ${stderr}`);
  }
  // 打印标准输出
  console.log(`标准输出: ${stdout}`);

  spawn("npm", ["run", "start"], { shell: true }, (error, stdout, stderr) => {
    if (error) {
      // 如果有错误，打印错误并退出
      console.error(`执行出错: ${error}`);
      process.exit(1);
    }
    if (stderr) {
      // 如果有标准错误输出，打印它
      console.error(`标准错误输出: ${stderr}`);
    }
    console.log(`标准输出: ${stdout}`);
  });
});
