'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

var http = require('http');
var express = require("express");
var RED = require("node-red");

// Create an Express app
var red_app = express();

// Add a simple route for static content served from 'public'
//red_app.use("/",express.static("public"));

// Create a server
var server = http.createServer(red_app);

// Create the settings object - see default settings.js file for other options
var settings = {
    httpAdminRoot:"/admin",
    httpNodeRoot: "/",
    userDir: __dirname,
    flowFile: "flows.json",
    functionGlobalContext: { }    // enables global context
};

// Initialise the runtime with a server and settings
RED.init(server,settings);

// Serve the editor UI from /red
red_app.use(settings.httpAdminRoot,RED.httpAdmin);

// Serve the http nodes UI from /api
red_app.use(settings.httpNodeRoot,RED.httpNode);

server.listen(8000);

// Start the runtime
RED.start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false
    },
  	width: 1024,
  	height: 768
  });

  mainWindow.loadURL("http://localhost:8000/ui");
  var webContents = mainWindow.webContents;
  webContents.on('did-get-response-details', function(event, status, newURL, originalURL, httpResponseCode) {
    if (httpResponseCode == 404)
      setTimeout(webContents.reload, 200);
  });

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
