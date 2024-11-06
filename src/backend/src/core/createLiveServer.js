const { spawn } = require("child_process");
const { folderContent } = require("../../../backend/src/utils/folder");
const websocket = spawn("npm", ["run", "backend-client-websocket"], {
  shell: true,
});

const createLiveServer = (projectInfo, resolve, reject) => {
  const {
    data: { type, url: name },
    port,
  } = projectInfo;

  const url = "";
  const child = spawn("npm", ["run", "liveServer"], {
    shell: true,
    env: {
      ...process.env,
      projectInfo: JSON.stringify(projectInfo),
    },
  });

  let arr = [];
  child.stdout.on("data", (data) => {
    arr.push(...data.toString().split("\n"));
    while (arr.length) {
      let info = arr.shift();

      if (info.includes("http://127.0.0.1"))
        resolve && resolve(info.split("url=")[1]);
      if (info.includes("clean exit") || info.includes("Page: close")) {
        websocket.stdin.write(
          `close:projectName=${projectInfo.name}δurl=${projectInfo.url}δport=${port}`
        );
        child.kill();
      }

      if (info.includes("Error:")) {
        reject && reject(info);
      }
    }
  });

  child.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    // reject && reject(data)
  });

  child.on("close", (code) => {
    console.log(`child process closed with code ${code}`);
  });

  child.on("exit", (code) => {
    console.log(`child process exited with code ${code}`);
  });

  if (!global.projectStatus.has(name + url))
    global.projectStatus.set(name + url, {
      url,
      name,
      port,
      childProcess: child,
    });
  else global.projectStatus.get(name + url).childProcess = child;
};

module.exports = {
  createLiveServer,
};
