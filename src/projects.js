// node js built in
const fs = require('fs');
const os = require('os');
const url = require('url');
const https = require('https');
const path = require('path');
const RED = require("node-red");


// 3rd party
const electron = require('electron');
const unzipper = require('unzipper');
const fstream = require('fstream');

const dialog = electron.dialog;
const ipc = electron.ipcMain;

let settings;
let store;
let app;
let mainFilePath;

async function newProjectDialog(){
    
  let saveResponse = await dialog.showSaveDialog({
      title:"New Project Directory"
  }).catch(function(err){});
  if( saveResponse === undefined || saveResponse.canceled ){
      return;
  }        
  let folder = saveResponse.filePath;
  
  
  try{
      let pathExists = fs.existsSync(folder);
      if( pathExists ){
          dialog.showErrorBox("Error Creating New Project","project location already exists");
          return;
      }
  }
  catch(e) {
      console.error(e);
      return;
  }    
  newProject(folder);
}

async function openProjectDialog(){
  
  let folder = await dialog.showOpenDialog({ 
      title: "Open Project",
      buttonLabel:"Open",
      defaultPath:settings.userDir || os.homedir(),
      properties:['openDirectory'] }).catch(function(err){});
   
  if( folder === undefined || folder.canceled ){
      return;
  }
  console.log(folder);
  folder = folder.filePaths;
  
  if( folder instanceof Array ){
      if(folder.length==0){
          return;
      }
      folder = folder[0];
  }
  
  openProject(folder);
}

async function newProject(folder){
      
  let onZipError = function(err){
      dialog.showErrorBox("Error Creating New Project","unable to download template, check network connection\n"+err.toString());
  }
  let loadZipResponse = async function(response){
      
      if(response.statusCode==302){
          console.log(`redirected to ${response.headers.location}`);
          https.get(response.headers.location,loadZipResponse).on('error',onZipError);
          return;
      }
      if(!fs.existsSync(folder)){
          console.log("new project folder ",folder);
          try{
              await fs.promises.mkdir(folder);
          }
          catch(e){
              dialog.showErrorBox("Error Creating New Project",`Failed to create project folder ${folder}\n ${e}`);
          }
      }
      
      response.pipe(unzipper.Extract({path:folder, getWriter: function(options){
          //write
          options.path = options.path.replace('lockkeeper-escape-room-template-master'+path.sep,'');
          console.log(options);
          return fstream.Writer(options);
      }}).on('end',function(){
          console.log("extract complete");
          
      }).on('error',function(e){
          console.error(e);
      }).on('finish',function(){
          console.log('extract finished');
          openProject(folder);    
      }));
  }
  https.get("https://github.com/paulhayes/lockkeeper-escape-room-template/archive/master.zip",loadZipResponse).on('error',onZipError);
}

function openProject(folder){
  if(!isProjectFolder(folder)){
      dialog.showErrorBox("Error Opening Project",`the selected folder,\n${folder}\nis not a valid project folder`);
      return;
  }
  //setupProject(folder);
  RED.stop();
  settings.userDir = folder;
  store.set('project_dir',folder);
  restart();
}

function setupProject(userdir){
  if (!fs.existsSync(path.join(userdir,flowfile))) {
      fs.writeFileSync(path.join(userdir,flowfile), fs.readFileSync(path.join(__dirname,flowfile)));
  }
  let credFile = flowfile.replace(".json","_cred.json");
  if (fs.existsSync(path.join(__dirname,credFile)) && !fs.existsSync(path.join(userdir,credFile))) {
      fs.writeFileSync(path.join(userdir,credFile), fs.readFileSync(path.join(__dirname,credFile)));
  }
}

function isProjectFolder(folder){
  let flowPath = path.join(folder,settings.flowFile);
  let packagePath = path.join(folder,"package.json");  
  //let credFilePath = flowfile.replace(".json","_cred.json");
  return fs.existsSync(packagePath) || fs.existsSync(flowPath);
}

function restart(){
  process.chdir(__dirname);
  //spawn new instance of app, and close this one
  //this is esencially a restart
  //TOFIX CURRENTLY WRONG DIR
  require('child_process').spawn(process.execPath,mainFilePath,{ detached : true, stdio:[0,1,2] });
  app.quit();
}

function init(_settings,_app,_store,_mainFilePath){
  settings = _settings;
  app = _app;
  store = _store;
  mainFilePath = _mainFilePath;

  ipc.on('newProjectDialog', newProjectDialog );
  ipc.on('openProjectDialog', openProjectDialog );
}

module.exports = {
  init,
  newProjectDialog,
  openProjectDialog,
  isProjectFolder,
  newProject,
  openProject    
}