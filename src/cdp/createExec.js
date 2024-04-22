const { spawn } = require('child_process');
const child = spawn('npm', ['run', 'cdp', '--url', 'https://www.baidu.com', 9222], { shell: true });
let child3 = null;
let child4 = null;
const child2 = spawn('npm', ['run', 'backend-client-websocket'], { shell: true })
let url = ''

setTimeout(() => {
  child3 = spawn('npm', ['run', 'cdp', '--url', 'https://www.taobao.com', 9223], { shell: true });
    child3.stdout.on('data', (data) => {
      if(data.includes('url')) {
        url = data.toString().split('url:')[1]
        child2.stdin.write('open:' + url)
      }
      
      console.log(`stdout: ${data}`);
      if(data.includes('clean exit')) {
        child2.stdin.write('close:' + url);
      }
    });
    
    child3.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    
    child3.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
}, 3000)

setTimeout(() => {
  child4 = spawn('npm', ['run', 'cdp', '--url', 'https://www.jd.com', 9224], { shell: true });
    child4.stdout.on('data', (data) => {
      if(data.includes('url')) {
        url = data.toString().split('url:')[1]
        child2.stdin.write('open:' + url)
      }
      
      console.log(`stdout: ${data}`);
      if(data.includes('clean exit')) {
        child2.stdin.write('close:' + url);
      }
    });
    
    child4.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    
    child4.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
}, 5000)

child.stdout.on('data', (data) => {
  if(data.includes('url')) {
    url = data.toString().split('url:')[1]
    child2.stdin.write('open:' + url)
  }
  
  console.log(`stdout: ${data}`);
  if(data.includes('clean exit')) {
    child2.stdin.write('close:' + url);
  }
});

child.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

child.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});



