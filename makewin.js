var electronInstaller = require('electron-winstaller');

// resultPromise = electronInstaller.createWindowsInstaller({
//     appDirectory: 'dist/Node-RED-win32-ia32',
//     outputDirectory: 'dist/installer32',
//     authors: 'IBM Corp.',
//     exe: 'Node-RED.exe'
// });
//
// resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice ia32: ${e.message}`));

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: 'dist/Node-RED-win32-x64',
    outputDirectory: 'dist/win',
    authors: 'IBM Corp.',
    exe: 'Node-RED.exe'
});

resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice x64: ${e.message}`));
