const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");
const hashUtils = require("./hash");

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
    console.log("文件写入成功！");
  } catch (err) {
    console.error("文件写入失败：", err);
    throw new Error("文件写入失败：", err);
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
    return null;
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

const findFile = (id, path = "") => {
  return (fs.readdirSync(folderPath(path)) ?? []).find(
    (item) => hashUtils.getHash(item) === id
  );
};

const deleteFile = async (filePath) => {
  try {
    fs.unlinkSync(filePath);
    console.log(`文件 ${filePath} 删除成功`);
  } catch (error) {
    console.log(`文件 ${filePath} 删除失败`);
  }
};

const deleteFolderRecursive = async (folderPath) => {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file, index) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // 递归删除文件夹
        deleteFolderRecursive(curPath);
      } else {
        // 删除文件
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath); // 删除空文件夹
    console.log(`文件夹 ${folderPath} 删除成功`);
  } else {
    console.error(`文件夹 ${folderPath} 不存在`);
  }
};

module.exports = {
  createFolder,
  folderExists,
  folderPath,
  folderInfo,
  folderContent,
  watchFolder,
  createFile,
  findFile,
  deleteFolderRecursive,
  deleteFile,
};
