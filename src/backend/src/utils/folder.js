
const fs = require('fs');
const path = require('path');

const folderExists = (path) => {
    return fs.existsSync(path)
}


const createFolder = (path) => {
  try {
    fs.mkdirSync(path, { recursive: true });
    console.log('Directory created successfully');
  } catch (err) {
    console.error('Failed to create directory', err);
  }
}

const folderPath = (folderName) => path.resolve(process.cwd() + '/Magic-Mock-Data', folderName) 

const folderInfo = (folderPath) => fs.statSync(folderPath);

const folderContent = (folderPath) => {
  try {
    const data = fs.readFileSync(folderPath, 'utf8');
    return data
  } catch (err) {
    console.error('Error reading file:', err);
  }
}

module.exports = {
  createFolder,
  folderExists,
  folderPath,
  folderInfo,
  folderContent
}
