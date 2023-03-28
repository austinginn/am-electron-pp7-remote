// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const express = require('express');
const history = require('connect-history-api-fallback');
const eApp = express();
const fs = require('fs');
const staticFileMiddleware = express.static(__dirname + '/dist');
const { networkInterfaces } = require('os');
const fetch = require('node-fetch');

const events = require('events');
const heartbeat = new events.EventEmitter();





const nets = networkInterfaces();
// console.log(nets);
const port = 8080

let render = {
    localIP: [],
    ip: "0.0.0.0",
    port: 5000,
}

//load save
//check if save file exists
// if (!fs.existsSync('save.json')) {
//     fs.writeFileSync('save.json', JSON.stringify(render));
// }

console.log("loading");
render = loadAppData()

console.log(render);


//recheck local IPs
render.localIP = [];

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
        if (net.family === familyV4Value && !net.internal) {
            render.localIP.push(net.address);
        }
    }
}

//check if selected IP matches local 
let match = false;
render.localIP.forEach((element) => {
    if (element == render.ip) {
        match = true;
    }
});

if (!match) {
    render.ip = render.localIP[0];
};



// Middleware for serving '/dist' directory
eApp.use(staticFileMiddleware);

// Support history api
// this is the HTTP request path not the path on disk
eApp.use(history({
    index: '/index.html'
}));

// 2nd call for redirected requests
eApp.use(staticFileMiddleware);


//HTTP client listen on 3000
eApp.listen(port, function () {
    console.log('listening on *:8080');
});

eApp.get('/', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.sendStatus(200);
});

eApp.get('/api/heartbeat', (req, res) => {
    heartbeat.emit('pulse', 'yo');
    res.sendStatus(200);
})

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 400,
        height: 425,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    })

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Once page loads send data
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('render', render);
        mainWindow.webContents.send('message', __dirname);
    });

    //send connection status to main window
    heartbeat.on('pulse', () => {
        console.log('client heartbeat');
        mainWindow.webContents.send('pulse', "yo");
    });

    

    ipcMain.on('save', (event, arg) => {
        console.log("Saving");
        render.ip = arg.ip;
        render.port = arg.port;
        saveAppData(render);
        mainWindow.webContents.send('render', render);
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    // if (process.platform !== 'darwin') 
    app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function getAppDataPath() {
    switch (process.platform) {
        case "darwin": {
            return path.join(process.env.HOME, "Library", "Application Support", "am-pp7-electron");
        }
        case "win32": {
            return path.join(process.env.APPDATA, "am-pp7-electron");
        }
        case "linux": {
            return path.join(process.env.HOME, ".am-pp7-electron");
        }
        default: {
            console.log("Unsupported platform!");
            process.exit(1);
        }
    }
}

function saveAppData(content) {
    const appDatatDirPath = getAppDataPath();

    // Create appDataDir if not exist
    if (!fs.existsSync(appDatatDirPath)) {
        fs.mkdirSync(appDatatDirPath);
    }

    const appDataFilePath = path.join(appDatatDirPath, 'save.json');
    content = JSON.stringify(content);

    //save file;
    fs.writeFileSync(appDataFilePath, content);
}

function loadAppData() {
    const appDatatDirPath = getAppDataPath();

    // Create appDataDir if not exist
    if (!fs.existsSync(appDatatDirPath)) {
        fs.mkdirSync(appDatatDirPath);
    }

    const appDataFilePath = path.join(appDatatDirPath, 'save.json');

    // Check if file exists
    if (!fs.existsSync(appDataFilePath)) {
        fs.writeFileSync(appDataFilePath, JSON.stringify({
            localIP: [],
            ip: "0.0.0.0",
            port: 5000,
        }));
    }

    let rawdata = fs.readFileSync(appDataFilePath);
    return JSON.parse(rawdata);
}

// const heartbeat = () => {
//     let interval = null;
//     const start = (ip, port) => {
//         interval = setInterval(async (ip, port) => {
//             let res = await fetch("http://" + ip + ":" + port + '/version');
//             if(res.status >= 400) {
                
//             } 
//         }, 2000)
//     }
// }
