const WebSocket = require('ws');
const moment = require('moment');
const createWebSocket = () => {
  const map = new Map()
  
  const wss = new WebSocket.Server({ port: 9090 });

  wss.on('connection', function connection(ws) {
    console.log('Client connected');

    ws.on('message', function incoming(message) {
      console.log('Received message from client:', message);
      if(message.includes('React:'))
        map.set('React', ws)
      else message.includes('Spawn:')
        map.set('Spawn', ws)

      if(message.includes('open:') || message.includes('close:')) {
        const status = message.includes('open:')
        const [projectNameKeyValue, urlKeyValue, portKeyValue] = message.split('&')
        const name = projectNameKeyValue.split('projectName=')[1]
        const url = urlKeyValue.split('url=')[1]
        const port = +portKeyValue.split('port=')[1]
        
        global.projectStatus.set(name, {
          name,
          url,
          status,
          port,
          timer: moment().format('YYYY-MM-DD HH:mm:ss')
        })
        
        map.get('React').send(message)
      }
    });

    ws.send('connected');
  });
}

module.exports = createWebSocket
