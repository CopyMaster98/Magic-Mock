const { spawn } = require("child_process");
const { folderContent } = require("../backend/src/utils/folder");
const websocket = spawn("npm", ["run", "backend-client-websocket"], {
  shell: true,
});

const createChildProcess = (projectInfo, resolve, reject) => {
  const { url, name, port } = projectInfo;
  const child = spawn("npm", ["run", "cdp"], {
    shell: true,
    env: {
      ...process.env,
      projectInfo: JSON.stringify(projectInfo),
    },
  });

  child.stdout.on("data", (data) => {
    const info = data.toString();
    if (info.includes("url=") && info.startsWith("projectName=")) {
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

    if (info.startsWith("matchedPath")) {
      const [
        matchedPathKeyValue,
        projectNameKeyValue,
        urlKeyValue,
        typeKeyValue,
      ] = info.split("&");
      const matchedPath = matchedPathKeyValue.split("matchedPath=")[1];
      const projectName = projectNameKeyValue.split("projectName=")[1];
      const url = urlKeyValue.split("url=")[1];
      const type = typeKeyValue.split("type=")[1];

      let content = folderContent(matchedPath);

      if (content) content = JSON.parse(content);

      websocket.stdin.write(
        `matched:matchedId=${content?.id}&projectName=${projectName}&url=${url}&port=${port}&type=${type}`
      );
    }

    if (info.includes("clean exit") || info.includes("Page: close")) {
      websocket.stdin.write(
        `close:projectName=${projectInfo.name}&url=${projectInfo.url}&port=${port}`
      );
    }

    if (info.includes("Error:")) {
      reject(info);
    }
  });

  child.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    // reject && reject(data)
  });

  child.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });

  if (!global.projectStatus.has(name + url))
    global.projectStatus.set(name + url, {
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
