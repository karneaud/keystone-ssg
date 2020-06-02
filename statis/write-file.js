const fs = require('fs-extra')
const path = require('path')

module.exports = function (finalPath, finalFileContent) {
  console.log('ENSURE', path.parse(finalPath).dir)
  fs.ensureDirSync(path.parse(finalPath).dir)
  fs.writeFileSync(finalPath, finalFileContent)
}
