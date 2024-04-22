const WebSocket = require('ws');

const createWebSocket = () => {
  const wss = new WebSocket.Server({ port: 9090 });

  wss.on('connection', function connection(ws) {
    console.log('Client connected');

    ws.on('message', function incoming(message) {
      console.log('Received message from client:', message);
    });

    ws.send('connected');
  });
}

module.exports = createWebSocket
