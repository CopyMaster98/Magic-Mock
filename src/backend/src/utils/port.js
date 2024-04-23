

const net = require('net');

function isPortTaken(port) {
  return new Promise((resolve) => {
    const client = net.createConnection({ port }, () => {
      client.end();
      resolve(true); // 端口被占用
    });

    client.on('error', () => {
      resolve(false); // 端口未被占用
    });
  });
}

function getRandomPort(min = 1024, max = 49151) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function handleExistPort(port) {
  const projectStatus = global.projectStatus

  if(!projectStatus || !projectStatus.size) return false

  return [...global.projectStatus.values()]?.find(item => item?.port === port) 
}

module.exports = {
  isPortTaken,
  getRandomPort,
  handleExistPort
}
