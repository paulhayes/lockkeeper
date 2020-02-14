
'use strict';

// Some settings you can edit easily

let flowfile = 'flows.json'; // default Flows file name - loaded at start
const urldash = "/ui/#/0";          // Start on the dashboard page
const urledit = "/red";             // url for the editor page
const appName = "Lockkeeper";
// tcp port to use
//const listenPort = "18880";                           // fix it if you like
const listenPort = parseInt(Math.random()*16383+49152)  // or random ephemeral port
const remotePort = 18880;
const remoteHost = null;
const host = "127.0.0.1";
const hostUrl = "http://"+host+":";

// node js core
const os = require('os');
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

// 3rd party dependancies
const express = require("express");
const electron = require('electron');
const Store = require('electron-store');

// app src
const menu = require('./src/menu');
const Settings = require('./settings');
const logging = require('./src/logging');
const projects = require('./src/projects');

const BrowserWindow = electron.BrowserWindow;
const app = electron.app;
const urlNoProject = '/no-project.html';
const mainFilePath = __filename;

app.setPath('userData', path.join(app.getPath('appData'), appName));

const store = new Store();

//Set the user data path to use the local
app.setName(appName);

// this should be placed at top of main.js to handle squirrel setup events quickly
if (handleSquirrelEvent()) { return; }

let RED = require("node-red");
let red_app = express();
// Keep a global reference of the window objects, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Add a simple route for static content served from 'public'
red_app.use("/",express.static("web"));
//red_app.use(express.static(__dirname +"/public"));

// Create a server
var server = http.createServer(red_app);


// Setup user directory and flowfile
var userdir = __dirname;

// By default we set the user directory to be 'lockkeeper' in the users home directory...
userdir = store.get('project_dir',null);

     
// console.log("CWD",process.cwd());
// console.log("DIR",__dirname);
// console.log("UserDir :",userdir);
// console.log("FlowFile :",flowfile);
// console.log("PORT",listenPort);

const settings = Settings(userdir);
settings.userDir = userdir;
settings.flowFile = flowfile;

logging.init(settings);
projects.init(settings,app,store,mainFilePath);


if( userdir!==null ){
  // Change current working directory to project dir
  process.chdir(userdir);
  // Initialise the runtime with a server and settings
  RED.init(server,settings);

  // Serve the editor UI from /red
  if (settings.httpAdminRoot !== false) {
    red_app.use(settings.httpAdminRoot,RED.httpAdmin);
  }

  // Serve the http nodes UI from /
  red_app.use(settings.httpNodeRoot,RED.httpNode);
}



// Create the main browser window
function createWindow() {
    let hasProject = userdir!==null;
    mainWindow = new BrowserWindow({
        title: app.getName(),
        //titleBarStyle: "hidden",
        width: 1024,
        height: 768,
        icon: path.join(__dirname, 'nodered.png'),
        fullscreenable: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: !hasProject
        }
    });
    mainWindow.loadURL(`file://${__dirname}/load.html`);
    mainWindow.gotoDashboard = function(){
      mainWindow.loadURL("http://localhost:"+listenPort+urldash);
    }

    mainWindow.gotoEditor = function(){
      mainWindow.loadURL("http://localhost:"+listenPort+urledit);
    }

    mainWindow.noProjectDialog = function(){
      mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, urlNoProject),
        protocol: 'file:',
        slashes: true
      }));
    }
    //if (process.platform !== 'darwin') { mainWindow.setAutoHideMenuBar(true); }

    mainWindow.webContents.on('did-start-loading', function(event, status, newURL, originalURL, httpResponseCode) {
        if ((httpResponseCode == 404) && (newURL == ("http://localhost:"+listenPort+urldash))) {
            setTimeout(mainWindow.webContents.reload, 250);
        }
        menu.init(mainWindow,logging,projects);
    });

    // mainWindow.webContents.on('did-finish-load', () => {
    //     console.log("LOADED DASHBOARD");
    // });

    mainWindow.webContents.on("new-window", function(e, url, frameName, disposition, options) {
        // if a child window opens... modify any other options such as width/height, etc
        // in this case make the child overlap the parent exactly...
        var w = mainWindow.getBounds();
        options.x = w.x;
        options.y = w.y;
        options.width = w.width;
        options.height = w.height;
        //re-use the same child name so all "2nd" windows use the same one.
        //frameName = "child";
    })

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Start the app full screen
    //mainWindow.setFullScreen(true)

    // Open the DevTools at start
    mainWindow.webContents.openDevTools();

    if(!hasProject){
      server.listen(listenPort,host,function(){
        mainWindow.noProjectDialog();
      });
    } else {
      // Start the Node-RED runtime, then load the inital dashboard page
      RED.start().then(function() {
        server.listen(listenPort,host,function() {
            mainWindow.loadURL(hostUrl+listenPort+urldash);       
        });
      });
    }

}

// Called when Electron has finished initialization and is ready to create browser windows.
app.on('ready', createWindow );

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') { 
        
        app.quit(); 
    }
});

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
        //mainWindow.loadURL(hostUrl+listenPort+urldash);
    }
});


///////////////////////////////////////////////////////
// All this Squirrel stuff is for the Windows installer
function handleSquirrelEvent() {
    if (process.argv.length === 1) { return false; }

    const path = require('path');
    const ChildProcess = require('child_process');
    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);
    const spawn = function(command, args) {
        let spawnedProcess, error;

        try { spawnedProcess = ChildProcess.spawn(command, args, {detached: true}); }
        catch (error) {}
        return spawnedProcess;
    };

    const spawnUpdate = function(args) {
        return spawn(updateDotExe, args);
    };

    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
        case '--squirrel-updated':
        // Optionally do things such as:
        // - Add your .exe to the PATH
        // - Write to the registry for things like file associations and
        //   explorer context menus

        // Install desktop and start menu shortcuts
        spawnUpdate(['--createShortcut', exeName]);

        setTimeout(app.quit, 1000);
        return true;

        case '--squirrel-uninstall':
        // Undo anything you did in the --squirrel-install and
        // --squirrel-updated handlers

        // Remove desktop and start menu shortcuts
        spawnUpdate(['--removeShortcut', exeName]);

        setTimeout(app.quit, 1000);
        return true;

        case '--squirrel-obsolete':
        // This is called on the outgoing version of your app before
        // we update to the new version - it's the opposite of
        // --squirrel-updated

        app.quit();
        return true;
    }
}
