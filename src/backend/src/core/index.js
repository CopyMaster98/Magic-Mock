const { LOCAL_SERVER, METHODS } = require("../constants");
const {
  folderExists,
  folderPath,
  folderContent,
  folderInfo,
} = require("../utils/folder");
const path = require("path");
const fs = require("fs");
const { hashUtils } = require("../utils");

const getLocalServerProjectData = (projectName) => {
  const projectPath = folderPath(projectName, LOCAL_SERVER);

  if (!folderExists(projectPath)) return [];

  const res = [];
  const methodsArray = fs
    .readdirSync(projectPath)
    .filter((item) => METHODS.includes(item));

  if (methodsArray.length) {
    methodsArray.forEach((item) => {
      const currentPath = path.join(projectPath, item);

      const filesContent = fs
        .readdirSync(currentPath)
        .filter((item) => item.includes(".json"))
        .map((fileName) => {
          const content = folderContent(path.join(currentPath, fileName));

          return {
            id: hashUtils.getHash(fileName),
            name: fileName,
            method: item,
            stats: folderInfo(path.join(currentPath, fileName)),
            content: content.length ? JSON.parse(content) : {},
            type: "cache",
          };
        });

      res.push(...filesContent);
    });
  }

  return res;
};

module.exports = { getLocalServerProjectData };
