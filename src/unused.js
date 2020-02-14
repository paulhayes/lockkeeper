

let remoteAccessForward;

function startRemoteAccess(){
  if(remoteAccessForward)
      return;

      remoteAccessForward = net.createServer(function(from) {
      var to = net.createConnection({
          host: host,
          port: post
      });
      from.pipe(to);
      to.pipe(from);
  }).listen(remotePort, remoteHost);
}

function stopRemoteAccess(){
  if(remoteAccessForward){
      remoteAccessForward.close(function(){
          remoteAccessForward = null;
      });
  }
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