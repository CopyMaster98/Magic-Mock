const path = require("path");

const ROOT_PATH = "/";

const MAGIC_MOCK_DATA = "Magic-Mock-Data";

const LOCAL_SERVER = "Local-Server";

const OFFLINE_RESOURCE = "Offline-Resource";

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

const MAGIC_MOCK_ROOT_PATH = path.resolve(
  process.cwd() + `/${MAGIC_MOCK_DATA}`
);

const LOCAL_SERVER_ROOT_PATH = path.resolve(process.cwd() + `/${LOCAL_SERVER}`);

module.exports = {
  ROOT_PATH,
  LOCAL_SERVER,
  MAGIC_MOCK_DATA,
  MAGIC_MOCK_ROOT_PATH,
  METHODS,
  LOCAL_SERVER_ROOT_PATH,
  OFFLINE_RESOURCE,
};
