const { spawn } = require('child_process');
// const child = spawn('npm', ['run', 'cdp', '--projectInfo', '11', 'https://www.jd.com', 9222], { shell: true });
// let child3 = null;
// let child4 = null;
const websocket = spawn('npm', ['run', 'backend-client-websocket'], { shell: true })

// let port = 9222
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

// setTimeout(() => {
//   let url = ''
//   child3 = spawn('npm', ['run', 'cdp', '--url', 'https://www.taobao.com', 9223], { shell: true });
//     child3.stdout.on('data', (data) => {
//       if(data.includes('url')) {
//         url = data.toString().split('url:')[1]
//         child2.stdin.write('open:' + url)
//       }
      
//       console.log(`stdout: ${data}`);
//       if(data.includes('clean exit')) {
//         child2.stdin.write('close:' + url);
//       }
//     });
    
//     child3.stderr.on('data', (data) => {
//       console.error(`stderr: ${data}`);
//     });
    
//     child3.on('close', (code) => {
//       console.log(`child process exited with code ${code}`);
//     });
// }, 3000)

// setTimeout(() => {
//   let url = ''
//   child4 = spawn('npm', ['run', 'cdp', '--url', 'https://www.jd.com', 9224], { shell: true });
//     child4.stdout.on('data', (data) => {
//       if(data.includes('url')) {
//         url = data.toString().split('url:')[1]
//         child2.stdin.write('open:' + url)
//       }
      
//       console.log(`stdout: ${data}`);
//       if(data.includes('clean exit')) {
//         child2.stdin.write('close:' + url);
//       }
//     });
    
//     child4.stderr.on('data', (data) => {
//       console.error(`stderr: ${data}`);
//     });
    
//     child4.on('close', (code) => {
//       console.log(`child process exited with code ${code}`);
//     });
// }, 5000)

module.exports = {
  createChildProcess
}