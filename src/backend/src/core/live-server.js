const { spawn } = require("child_process");
const path = require("path");

const {
  data: { type, url: name },
  port,
} = process.env.projectInfo ? JSON.parse(process.env.projectInfo) : {};

const localPath = path.join(
  path.dirname(__dirname),
  `../../../Offline-Resource/${encodeURIComponent(name)}`
);

console.log(localPath, path.dirname(__dirname));
// 启动 live-server
const server = spawn(
  "npx",
  ["http-server", `${localPath}/`, `--port=${port}`, "--cors"],
  {
    shell: true,
  }
); // 可根据需要添加其他选项

// 打印 live-server 的输出
server.stdout.on("data", (data) => {
  console.log(`stdout: url=http://127.0.0.1:${port}`);
});

server.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

server.on("close", (code) => {
  console.log(`子进程退出，退出码 ${code}`);
});
