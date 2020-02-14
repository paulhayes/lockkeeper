const electron = require('electron');
const {Menu, MenuItem} = electron;

const init = function(mainWindow,logging,projects){

// Create the Application's main menu
var template = [
  // {label: "Application",
  // submenu: [
  //     //{ role: 'about' },
  //     //{ type: "separator" },
  //     { role: 'togglefullscreen' },
  //     { role: 'quit' }
  // ]},
  { label: "Menu",
  submenu: [
      {   type: 'separator' },
      {
          label: "New Project",
          click: projects.newProjectDialog
      },
      {
          label: "Open Project", 
          click: projects.openProjectDialog           
      },
      {   type: 'separator' },
      {   label: 'Console',
          accelerator: "Shift+CmdOrCtrl+C",
          click: logging.createConsole
      },
      {   label: 'Dashboard',
          accelerator: "Shift+CmdOrCtrl+D",
          click: mainWindow.gotoDashboard
      },
      {   label: 'Editor',
          accelerator: "Shift+CmdOrCtrl+E",
          click: mainWindow.gotoEditor
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
  ]},
  {
    label: "Edit",
    submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
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

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

module.exports = {
  init
}