const os = require("os");
const { exec } = require("child_process");

const isOperatingSystem = () => {
  const platform = os.platform();

  if (platform === "darwin") {
    return "macOS";
  } else if (platform === "win32") {
    return "Windows";
  } else {
    return "Other";
  }
};

module.exports = {
  isOperatingSystem,
};