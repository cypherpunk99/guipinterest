//////////////////////////////////
///////////// CONTROLLER /////////
//////////////////////////////////

'use strict';

var path = require('path');
const url = require('url');
const BrowserWindow = require('electron').remote.BrowserWindow;
const {dialog} = require('electron').remote;
var config = require('./config/default');
const devIsOpen = config.App.devTools;
var softname = config.App.softname;
const ipc = require('electron').ipcRenderer;

var logsDir = path.join(os.tmpdir(), softname, 'logs');

ipc.on('add', (event, users) => {
  addUsersDb(users);
});

ipc.on('edit', (event, user) => {
  editUserDb(user);
});

ipc.on('sync_db', (event) => {
  initViewDb();
});

ipc.on('task_complete', (event, rows, taskName, params ) => {
  console.log(rows);
  completeUserTaskDb(rows, taskName, params);
});

ipc.on('add_task', (event, task ) => {
  addTaskDb(task);
});

function checkSecurityController(cb) {
  checkLicense(cb);
}

function openDevTool(win, isOpen) {
  if (isOpen) {
    win.webContents.openDevTools()
  } else {
    win.webContents.on("devtools-opened", () => {
      win.webContents.closeDevTools();
    });
  }
}

function editUserController(user) { 
  if (user.length == 0) {
    dialog.showMessageBox({ 
      message: "Пользователь не выбран",
      buttons: ["OK"] 
    });
  } else if (user.length > 1) {
    dialog.showMessageBox({ 
      message: "Выберите одного пользователя",
      buttons: ["OK"] 
    });
  } else if (user.length == 1) {
    let editView = new BrowserWindow({width: 600, height: 300, frame: true});
    editView.setMenu(null)
    editView.loadURL(url.format({
      pathname: path.join(__dirname, 'html', 'edit.html'),
      protocol: 'file:',
      slashes: true
    }))
    editView.on('close', function() {
      editView = null;
    });
    window.onbeforeunload = function (e) { 
      editView.webContents.send('closing');
      return false;
    }
    
    editView.webContents.on('did-finish-load', () => {
      getItemDb(user[0], editView.webContents ); 
    });
    openDevTool(editView, devIsOpen);
  }

}

function tasksController(action, rows) {
  let taskView = new BrowserWindow({width: 1000, height: 800, frame: true});
  taskView.setMenu(null)
  taskView.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'task.html'),
    protocol: 'file:',
    slashes: true
  }))
  taskView.on('close', function() {
    taskView = null;
  });
  // Prevent from closing main window
  window.onbeforeunload = function (e) { 
    taskView.webContents.send('closing');
    return false;
  }
  taskView.webContents.on('did-finish-load', () => {
    if (action == "add" && rows.length > 0) {
      taskView.webContents.send('type', 'user', rows);
    } else if (action == "add" && rows.length == 0) {
      taskView.webContents.send('type', 'task');
    } else if (action == "edit" && rows.length == 1) {
      getItemDb(rows[0], taskView.webContents);
    }
  });
  openDevTool(taskView, devIsOpen);
}

function showLogsController(rows) {
  checkFolderExists(logsDir);
  rows.forEach(function (row_id) {
    var l_filepath = path.join(logsDir, row_id + ".txt");
    if (fs.existsSync(l_filepath) ) {
      let loggerView = new BrowserWindow({width: 600, height: 300, frame: true});
      loggerView.setMenu(null)
      loggerView.loadURL(url.format({
        pathname: path.join(__dirname, 'html', 'log.html'),
        protocol: 'file:',
        slashes: true
      }))

      loggerView.on('closed', function() {
        loggerView = null;
      });
      loggerView.webContents.on('did-finish-load', () => {
        loggerView.webContents.send('log_data', l_filepath, row_id);
      });

      fs.watchFile(l_filepath, (curr, prev) => {
        if (curr == prev) {} else {
          loggerView.webContents.send('log_data_changed', l_filepath, row_id);
          // console.log(`the current mtime is: ${curr.mtime}`);
          // console.log(`the previous mtime was: ${prev.mtime}`);
        }
      });
      openDevTool(loggerView, devIsOpen);
    } else {
      dialog.showMessageBox({ 
        message: `Логи для ${row_id} отсутствуют`,
        buttons: ["OK"] 
      });
    }
  });
}

function addUsersController() {
  let addView = new BrowserWindow({width: 600, height: 300, frame: true})
  addView.setMenu(null)
  addView.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'add.html'),
    protocol: 'file:',
    slashes: true
  }))
  addView.on('closed', function() {
    addView = null;
  })
  // Prevent from closing main window
  window.onbeforeunload = function (e) { 
    addView.webContents.send('closing');
    return false;
  }
  openDevTool(addView, devIsOpen); 
}
