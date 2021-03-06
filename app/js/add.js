ipc = require('electron').ipcRenderer;
const fs = require("fs");
window.$ = window.jQuery = require('jquery');
var config = require('../config/default');
var softname = config.App.softname;

document.title = "Добавить аккаунты | " + softname

ipc.on('closing', () => {});

ipc.on('selected_accounts', (event, message) => {
  var test = document.getElementById("test");
  for (var n = 0; n < message.length; n ++) {
    test.innerHTML += message[n] + "<br>";
  }
});

function isEmpty(x) {
  if (x !== "") {
    return true;
  }
}

var openFile = function(selector) {
  const {dialog} = require('electron').remote
  var path = dialog.showOpenDialog({properties: ['openFile']});
  if (path) {
    document.getElementById(selector).value = path;
  }
}

var parseDataFileToArray = (selector) => {
  var filename = document.getElementById(selector).value;
  fs.readFile(filename, function(err, f) {
    var array = f.toString().split(/\r\n|\r|\n/).filter(isEmpty);
    ipc.send('users_add', array);
    window.close(); 
  });
}
