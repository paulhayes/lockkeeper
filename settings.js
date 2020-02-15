
const fs = require('fs');
const path = require('path');

const Settings = function(projectDir){
  console.log("Fetching Settings");
  const nodeRedDefaultSettings = require('./node_modules/node-red/settings');

  // Create the settings object - see default settings.js file for other options
  let settings = {
    httpAdminRoot: "/red",  // set to false to disable editor/deploy
    httpNodeRoot: "/",
    //userDir: ,
    //flowFile: flowfile,
    readOnly: false,
    flowFilePretty: true,
    editorTheme: { projects:{ enabled:false } },
    functionGlobalContext: { },    // enables global context
    //logging : see logging.js 
  };
  
  settings = Object.assign(nodeRedDefaultSettings,settings);

  if(projectDir && fs.existsSync(projectDir)){
    let projectSettings = require(path.join(projectDir,'package.json'));
    if('node-red' in projectSettings && typeof(projectSettings['node-red']['settings'])==='object'){
      settings = Object.assign(settings,projectSettings['node-red']['settings']);
    }
    console.log("PROJECT SETTINGS");
    console.log(projectSettings);
    console.log(settings);
  }


  return settings;
}

module.exports = Settings;