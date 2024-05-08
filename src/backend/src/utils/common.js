const deepUpdateValue = (data, key, value) => {
  if (Array.isArray(data)) {
    data.forEach((item) => {
      deepUpdateValue(item, key, value);
    });
  } else if (Object.prototype.toString.call(data) === "[object Object]") {
    Object.keys(data).forEach((item) => {
      if (item === key) {
        data[item] = value;
      }
      deepUpdateValue(data[item], key, value);
    });
  }
};

module.exports = {
  deepUpdateValue,
};
