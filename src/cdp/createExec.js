const { spawn } = require('child_process');
const child = spawn('npm', ['run', 'cdp'], { shell: true });
const child2 = spawn('npm', ['run', 'backend-client-websocket'], { shell: true })
let url = ''

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
