
const fs = require('fs');
const path = require('path');

const folderExists = (path) => {
    return fs.existsSync(path)
}


const createFolder = (path) => {
  try {
    fs.mkdirSync(path);
    console.log('Directory created successfully');
  } catch (err) {
    console.error('Failed to create directory', err);
  }
}

const folderPath = (folderName) => path.resolve(process.cwd(), folderName) 

module.exports = {
  createFolder,
  folderExists,
  folderPath
}
