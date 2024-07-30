const WebSocket = require("ws");
// 创建WebSocket客户端
const ws = new WebSocket("ws://localhost:9090");

ws.onopen = function (event) {
  // 发送消息给服务器
  ws.send("Spawn: open");
};

// 当收到服务器回复时
ws.onmessage = function (event) {
  console.log("Received from server:", event.data);
};

process.stdin.on("readable", () => {
  let chunk;
  // 读取父进程传入的消息
  while ((chunk = process.stdin.read()) !== null) {
    ws.send(chunk.toString());
  }
});

// 结束输入流，表示不会再接收更多的数据
process.stdin.on("end", () => {
  console.log("父进程关闭了输入流");
});
