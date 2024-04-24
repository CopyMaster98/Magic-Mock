const { spawn } = require('child_process');
// const child = spawn('npm', ['run', 'cdp', '--projectInfo', '11', 'https://www.jd.com', 9222], { shell: true });
// let child3 = null;
// let child4 = null;
const websocket = spawn('npm', ['run', 'backend-client-websocket'], { shell: true })

const createChildProcess = (projectInfo) => {
  const { url, name, port } = projectInfo
  const child = spawn('npm', ['run', 'cdp', '--projectInfo', name, url, port], { shell: true });
  child.stdout.on('data', (data) => {
    const info = data.toString()
    if(info.includes('url=') && info.includes('projectName=')) {
      const [projectNameKeyValue, urlKeyValue] = info.split('&');
      const projectName = projectNameKeyValue.split('projectName=')[1]
      const url = urlKeyValue.split('url=')[1]
      
      projectInfo.projectName = projectName
      projectInfo.url = url
      websocket.stdin.write(`open:projectName=${projectName}&url=${url}&port=${port}`)
    }
    
    console.log(`stdout: ${data}`);
    if(data.includes('clean exit')) {
      websocket.stdin.write(`close:projectName=${projectInfo.projectName}&url=${projectInfo.url}&port=${port}`);
    }
  });
  
  child.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
  
  child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

// createChildProcess({
//   name: '123',
//   url: 'https://www.baidu.com',
//   port: 9222
// })

module.exports = {
  createChildProcess
}