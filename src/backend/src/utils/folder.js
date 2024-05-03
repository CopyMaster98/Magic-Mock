const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");

const folderExists = (path) => {
  return fs.existsSync(path);
};

const createFolder = (path) => {
  try {
    fs.mkdirSync(path, { recursive: true });
    console.log("Directory created successfully");
  } catch (err) {
    console.error("Failed to create directory", err);
  }
};

const createFile = (filePath, content) => {
  try {
    // 使用 fs.writeFileSync 方法创建文件
    fs.writeFileSync(filePath, content);
    console.log("文件创建成功！");
  } catch (err) {
    console.error("文件创建失败：", err);
    throw new Error("文件创建失败：", err);
  }
};

const folderPath = (folderName) =>
  path.resolve(process.cwd() + "/Magic-Mock-Data", folderName);

const folderInfo = (folderPath) => fs.statSync(folderPath);

const folderContent = (folderPath) => {
  try {
    const data = fs.readFileSync(folderPath, "utf8");
    return data;
  } catch (err) {
    console.error("Error reading file:", err);
  }
};

const watchFolder = (folderPath, clients) => {
  const watcher = chokidar.watch(folderPath, {
    ignored: /(^|[/\\])\../, // 忽略隐藏文件
    persistent: true, // 持续监听
  });
  watcher.on("all", (event, path) => {
    if (["unlinkDir", "addDir"].includes(event)) {
      const reactClient = clients.get("React");
      if (reactClient) reactClient.send("update");
    }
  });
};

module.exports = {
  createFolder,
  folderExists,
  folderPath,
  folderInfo,
  folderContent,
  watchFolder,
  createFile,
};
