const WebSocket = require("ws");
const moment = require("moment");
const createWebSocket = () => {
  const map = new Map();

  const wss = new WebSocket.Server({ port: 9090 });

  wss.on("connection", function connection(ws) {
    console.log("Client connected");

    ws.on("message", function incoming(message) {
      console.log("Received message from Node WebSocket Client:", message);
      if (message.includes("React:")) map.set("React", ws);
      else message.includes("Spawn:");
      map.set("Spawn", ws);

      if (message.includes("open:") || message.includes("close:")) {
        const status = message.includes("open:");
        const [projectNameKeyValue, urlKeyValue, portKeyValue] =
          message.split("δ");
        const name = projectNameKeyValue?.split("projectName=")[1];
        const url = urlKeyValue?.split("url=")[1];
        const port = +portKeyValue?.split("port=")[1];

        global.projectStatus.set(name + url, {
          ...global.projectStatus.get(name + url),
          status,
          timer: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
        if (map.get("React")?.readyState === WebSocket.OPEN)
          map.get("React")?.send(message);
      }

      if (message.includes("matched:")) {
        if (map.get("React")?.readyState === WebSocket.OPEN)
          map.get("React")?.send(message);
      }
    });

    if (ws.readyState === WebSocket.OPEN) ws.send("connected");
  });

  return map;
};

module.exports = createWebSocket;
