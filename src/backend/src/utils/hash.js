const crypto = require("crypto");

const getHash = (data, len = 16) => {
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, len);
};

module.exports = {
  getHash,
};
