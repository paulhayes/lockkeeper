
'use strict';

// Some settings you can edit easily

const editable = true;      // Set this to false to create a run only application - no editor/no console
const allowLoadSave = false;        // set to true to allow omport and export of flow
const showMap = false;              // set to true to add Worldmap to the menu
let flowfile = 'electronflow.json'; // default Flows file name - loaded at start
const urldash = "/ui/#/0";          // Start on the dashboard page
const urledit = "/red";             // url for the editor page
const urlconsole = "/console.htm";  // url for the console page
const urlmap = "/worldmap";         // url for the worldmap

// tcp port to use
//const listenPort = "18880";                           // fix it if you like
const listenPort = parseInt(Math.random()*16383+49152)  // or random ephemeral port

const os = require('os');
const fs = require('fs');
const url = require('url');
const path = require('path');
const http = require('http');
const express = require("express");
const electron = require('electron');

const app = electron.app;
const ipc = electron.ipcMain;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;
const {Menu, MenuItem} = electron;

// this should be placed at top of main.js to handle squirrel setup events quickly
if (handleSquirrelEvent()) { return; }

var RED = require("node-red");
var red_app = express();

// Add a simple route for static content served from 'public'
red_app.use("/",express.static("web"));
//red_app.use(express.static(__dirname +"/public"));

// Create a server
var server = http.createServer(red_app);

var userdir = __dirname;
if (editable) {
    if (process.argv[1] && (process.argv[1] === "main.js")) {
        userdir = __dirname;
    }
    else { // We set the user directory to be in the users home directory...
        userdir = os.homedir() + '/.node-red';
        if (!fs.existsSync(userdir)) {
            fs.mkdirSync(userdir);
        }
        if (!fs.existsSync(userdir+"/"+flowfile)) {
            fs.writeFileSync(userdir+"/"+flowfile, fs.readFileSync(__dirname+"/"+flowfile));
        }
    }
}
console.log("UserDir :",userdir);
// console.log("PORT",listenPort);

// Keep a global reference of the window objects, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let conWindow;
let logBuffer = [];
let logLength = 250;

ipc.on('clearLogBuffer', function(event, arg) { logBuffer = []; });

// Create the settings object - see default settings.js file for other options
var settings = {
    httpAdminRoot: "/red",  // set to false to disable editor/deploy
    httpNodeRoot: "/",
    userDir: userdir,
    flowFile: flowfile,
    editorTheme: { projects:{ enabled:false } },
    functionGlobalContext: { },    // enables global context
    logging: {
        websock: {
            level: 'info',
            metrics: false,
            handler: function() {
                return function(msg) {
                    if (editable) {  // No logging if not editable
                        var ts = (new Date(msg.timestamp)).toISOString();
                        ts = ts.replace("Z"," ").replace("T"," ");
                        var line = ts+" : "+msg.msg;
                        logBuffer.push(line);
                        if (conWindow) { conWindow.webContents.send('debugMsg', line); }
                        if (logBuffer.length > logLength) { logBuffer.shift(); }
                    }
                }
            }
        }
    }
};
if (!editable) {
    settings.httpAdminRoot = false;
    settings.readOnly = true;
 }

// Initialise the runtime with a server and settings
RED.init(server,settings);

// Serve the editor UI from /red
if (settings.httpAdminRoot !== false) {
    red_app.use(settings.httpAdminRoot,RED.httpAdmin);
}

// Serve the http nodes UI from /
red_app.use(settings.httpNodeRoot,RED.httpNode);

// Create the Application's main menu
var template = [
    // {label: "Application",
    // submenu: [
    //     //{ role: 'about' },
    //     //{ type: "separator" },
    //     { role: 'togglefullscreen' },
    //     { role: 'quit' }
    // ]},
    { label: 'Node-RED',
    submenu: [
        {   label: 'Import Flow',
            click() { openFlow(); }
        },
        {   label: 'Save Flow As',
            click() { saveFlow(); }
        },
        {   type: 'separator' },
        {   label: 'Console',
            accelerator: "Shift+CmdOrCtrl+C",
            click() { createConsole(); }
        },
        {   label: 'Dashboard',
            accelerator: "Shift+CmdOrCtrl+D",
            click() { mainWindow.loadURL("http://localhost:"+listenPort+urldash); }
        },
        {   label: 'Editor',
            accelerator: "Shift+CmdOrCtrl+E",
            click() { mainWindow.loadURL("http://localhost:"+listenPort+urledit); }
        },
        {   label: 'Worldmap',
            accelerator: "Shift+CmdOrCtrl+M",
            click() { mainWindow.loadURL("http://localhost:"+listenPort+urlmap); }
        },
        {   type: 'separator' },
        {   label: 'Documentation',
            click() { electron.shell.openExternal('https://nodered.org/docs') }
        },
        {   label: 'Flows and Nodes',
            click() { electron.shell.openExternal('https://flows.nodered.org') }
        },
        {   label: 'Discourse Forum',
            click() { electron.shell.openExternal('https://discourse.nodered.org/') }
        },
        {   type: "separator" },
        {   role: 'togglefullscreen' },
        {   role: 'quit' }
    ]}
    // ,{label: "Edit",
    // submenu: [
    //     { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
    //     { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
    //     { type: "separator" },
    //     { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
    //     { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
    //     { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
    //     { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    // ]}
    // ,{ label: 'View',
    // submenu: [
    //     {   label: 'Reload',
    //         accelerator: 'CmdOrCtrl+R',
    //         click(item, focusedWindow) { if (focusedWindow) { focusedWindow.reload(); }}
    //     },
    //     {   label: 'Toggle Developer Tools',
    //         accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
    //         click(item, focusedWindow) { if (focusedWindow) { focusedWindow.webContents.toggleDevTools(); }}
    //     },
    //     {   type: 'separator' },
    //     {   role: 'resetzoom' },
    //     {   role: 'zoomin' },
    //     {   role: 'zoomout' },
    //     {   type: 'separator' },
    //     {   role: 'togglefullscreen' },
    //     {   role: 'minimize' }
    // ]}
];

if (!showMap) { template[0].submenu.splice(6,1); }

if (!editable) {
    template[0].submenu.splice(3,1);
    template[0].submenu.splice(4,1);
}

if (!allowLoadSave) { template[0].submenu.splice(0,2); }

let fileName = ""
function saveFlow() {
    dialog.showSaveDialog({
        filters:[{ name:'JSON', extensions:['json'] }],
        defaultPath: fileName
    }, function(file_path) {
        if (file_path) {
            var flo = JSON.stringify(RED.nodes.getFlows().flows);
            fs.writeFile(file_path, flo, function(err) {
                if (err) { dialog.showErrorBox('Error', err); }
                else {
                    dialog.showMessageBox({
                        icon: "nodered.png",
                        message:"Flow file saved as\n\n"+file_path,
                        buttons: ["OK"]
                    });
                }
            });
        }
    });
}

function openFlow() {
    dialog.showOpenDialog({ filters:[{ name:'JSON', extensions:['json']} ]},
        function (fileNames) {
            if (fileNames) {
                //console.log(fileNames[0]);
                fs.readFile(fileNames[0], 'utf-8', function (err, data) {
                    try {
                        var flo = JSON.parse(data);
                        if (Array.isArray(flo) && (flo.length > 0)) {
                            RED.nodes.setFlows(flo,"full");
                            fileName = fileNames[0];
                        }
                        else {
                            dialog.showErrorBox("Error", "Failed to parse flow file.\n\n  "+fileNames[0]+".\n\nAre you sure it's a flow file ?");
                        }
                    }
                    catch(e) {
                        dialog.showErrorBox("Error", "Failed to load flow file.\n\n  "+fileNames[0]);
                    }
                });
            }
        }
    )
}

// Create the console log window
function createConsole() {
    if (conWindow) { conWindow.show(); return; }
    // Create the hidden console window
    conWindow = new BrowserWindow({
        title: "Node-RED Console",
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'nodered.png'),
        autoHideMenuBar: true
    });
    conWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'console.htm'),
        protocol: 'file:',
        slashes: true
    }))
    conWindow.webContents.on('did-finish-load', () => {
        conWindow.webContents.send('logBuff', logBuffer);
    });
    conWindow.on('closed', () => {
        conWindow = null;
    });
    //conWindow.webContents.openDevTools();
}

// Create the main browser window
function createWindow() {
    mainWindow = new BrowserWindow({
        title: "Node-RED",
        //titleBarStyle: "hidden",
        width: 1024,
        height: 768,
        icon: path.join(__dirname, 'nodered.png'),
        fullscreenable: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false
        }
    });
    mainWindow.loadURL(`file://${__dirname}/load.html`);
    //if (process.platform !== 'darwin') { mainWindow.setAutoHideMenuBar(true); }

    mainWindow.webContents.on('did-get-response-details', function(event, status, newURL, originalURL, httpResponseCode) {
        if ((httpResponseCode == 404) && (newURL == ("http://localhost:"+listenPort+urldash))) {
            setTimeout(mainWindow.webContents.reload, 250);
        }
        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
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
    //mainWindow.webContents.openDevTools();
}

// Called when Electron has finished initialization and is ready to create browser windows.
app.on('ready', createWindow );

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') { app.quit(); }
});

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
        mainWindow.loadURL("http://127.0.0.1:"+listenPort+urldash);
    }
});

// Start the Node-RED runtime, then load the inital dashboard page
RED.start().then(function() {
    server.listen(listenPort,"127.0.0.1",function() {
        mainWindow.loadURL("http://127.0.0.1:"+listenPort+urldash);
    });
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
