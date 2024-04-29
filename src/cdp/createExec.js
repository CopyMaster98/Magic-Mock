const { spawn } = require("child_process");
const websocket = spawn("npm", ["run", "backend-client-websocket"], {
  shell: true,
});

const createChildProcess = (projectInfo, resolve, reject) => {
  const { url, name, port } = projectInfo;
  const child = spawn("npm", ["run", "cdp", "--projectInfo", name, url, port], {
    shell: true,
  });

  child.stdout.on("data", (data) => {
    const info = data.toString();
    if (info.includes("url=") && info.includes("projectName=")) {
      const [projectNameKeyValue, urlKeyValue] = info.split("&");
      const projectName = projectNameKeyValue.split("projectName=")[1];
      const url = urlKeyValue.split("url=")[1];

      projectInfo.name = projectName;
      projectInfo.url = url;
      resolve && resolve();
      websocket.stdin.write(
        `open:projectName=${projectName}&url=${url}&port=${port}`
      );
    }

    console.log(`stdout: ${data}`);
    if (data.includes("clean exit") || data.includes("Page: close")) {
      websocket.stdin.write(
        `close:projectName=${projectInfo.name}&url=${projectInfo.url}&port=${port}`
      );
    }
  });

  child.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    // reject && reject(data)
  });

  child.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });

  if (!global.projectStatus.has(name))
    global.projectStatus.set(name, {
      url,
      name,
      port,
      childProcess: child,
    });
};

// createChildProcess({
//   name: '123',
//   url: 'https://www.baidu.com',
//   port: 9333
// })

module.exports = {
  createChildProcess,
};
