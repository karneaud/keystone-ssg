const fs = require('fs-extra')
const plugins = require('./plugins.js')
const runRollup = require('./run-rollup.js')
const path = require('path')
const state = require('./state.js')

const compileTypes = {
  import: addImport,
  path: addPath,
  script: addScript,
  style: addStyle
}

module.exports = async function ({ fileContent, fileObj, fileName }) {
  return compiler(fileContent, fileObj, fileName)
}

async function compiler (fileContent, fileObj, fileName) {
  const asyncPromises = []
  const asyncResults = []
  const varRegex = /<<([^<>]+)=([^<>]+)>>/igm
  fileContent.replace(varRegex, (match, p1, p2) => {
    // console.log('MATCHES', match, p1, p2)
    asyncPromises.push(new Promise((resolve, reject) => {
      console.log('push pls')
      const command = { func: p1.trim(), val: p2.trim() }
      if (Object.keys(compileTypes).includes(command.func)) {
        compileTypes[command.func](command.val, fileObj, fileName).then(res => {
          asyncResults.push(res || match)
          resolve()
          return match
        })
      } else {
        asyncResults.push(match)
        resolve()
        return match
      }
    }))
  })

  console.log('IN BETWEEN', asyncPromises)

  return Promise.all(asyncPromises).then(() => {
    let count = 0
    console.log('Start promise')
    const newFileContent = fileContent.replace(varRegex, (match, p1, p2) => {
      console.log('count', count, asyncResults)
      return asyncResults[count++]
    })
    return newFileContent
  })

  // return newFileContent
}

async function addPath (filePath) {
  return filePath
}

async function addScript (filePath, fileObj) {
  // Need to runPlugins()
  const newPath = path.join('js', path.parse(filePath).name + '.js')
  const scriptContent = fs.readFileSync(filePath, 'utf-8')
  const publicPath = path.join('public', newPath)
  if (!alreadyCompiled(filePath)) {
    runRollup(scriptContent, fileObj, newPath).then(result => {
      fs.ensureDirSync(path.join('public', 'js'))
      fs.writeFileSync(publicPath, result.fileContent)
    })
  }
  return '<script src="' + newPath + '"></script>'
}

async function addStyle (filePath) {
  // Need to runPlugins()
  const newPath = path.join('css', path.parse(filePath).name + '.css')
  const scriptContent = fs.readFileSync(filePath, 'utf-8')
  // console.log('CONTEN', scriptContent)
  const publicPath = path.join('public', newPath)
  if (!alreadyCompiled(filePath)) {
    fs.ensureDirSync(path.join('public', 'css'))
    fs.writeFileSync(publicPath, scriptContent)
  }
  return '<link rel="stylesheet" href="' + newPath + '">'
}

async function addImport (filePath) {
  filePath = path.normalize(filePath)
  // console.log(2, filePath)
  try {
    if (fs.existsSync(filePath)) {
      console.log('exist')
      const fileObj = path.parse(filePath)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const newFile = await runRollup(fileContent, fileObj, filePath) // need to use then
      // console.log('sfagfd', newFile.fileContent)
      // newFile.fileContent = await compiler(newFile.fileContent)
      newFile.fileContent = await compiler(newFile.fileContent)
      return await newFile.fileContent // and return promise
    } else {
      return false
    }
  } catch (err) {
    console.error(err)
    return false
  }
}

function alreadyCompiled (filePath) {
  return state.filesBuilt.includes(path.normalize(filePath))
}
