const constants = require('./constants')

const electron = require('electron')
const fs = require('fs')
const {
    app,
    BrowserWindow,
    ipcMain: ipc,
    Menu,
    dialog
} = electron
const isDev = require('electron-is-dev')
const menuTemplate = require('./app/lib/menu')


// Create folder if it doesn't exists from before
if (!fs.existsSync(`${constants.DB_PATH}/Writer`)) {
    fs.mkdirSync(`${constants.DB_PATH}/Writer`)
}

const Datastore = require('nedb')
const db = new Datastore({ filename: `${constants.DB_PATH}/Writer/writer.db`, autoload: true })
const dbPref = new Datastore({ filename: `${constants.DB_PATH}/Writer/writerPref.db`, autoload: true })

let client

// Insert pref if null
dbPref.loadDatabase((err) => {
    dbPref.find({}, (err, docs) => {
        console.log(docs)
        if (docs.length === 0) {
            const prefDoc = {
                darkmode : false,
                fontfamily: 'AmaticSC',
                fontsize: 32
            }

            dbPref.insert(prefDoc, (err, newDoc) =>  {})
        }
    })
})

if (isDev) {
    client = require('electron-connect').client
}

app.on('ready', _ => {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        minWidth: 650,
        minHeight: 400,
        center: true,
        titleBarStyle: "default",
        title: 'Writer'
    })
    mainWindow.loadURL(`file://${__dirname}/index.html`)
    mainWindow.webContents.openDevTools()

    mainWindow.on('closed', _ => {
        mainWindow = null
    })

    if (isDev) {
        client.create(mainWindow)
    }

    const menuContents = Menu.buildFromTemplate(menuTemplate(mainWindow))
    Menu.setApplicationMenu(menuContents)
})

app.on('window-all-closed', _ => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', _ => {
    if (mainWindow === null) {
        createWindow()
    }
})

// Save file
ipc.on('save-file-as-txt', (evt, content) => {
    console.log('save file with content: ' + content)
    dialog.showSaveDialog({
        title: 'Save file',
        filters: [{
            name: 'text',
            extensions: ['txt']
        }]
    }, (filename) => {
        console.log(filename)
        console.log(content)
        if (filename !== undefined)
            fs.writeFile(filename, content, (err) => {
                if (err) console.log(err)
                console.log(`It's saved`)
            })
    })
})

ipc.on('save-file-as-html', (evt, content) => {
    console.log('save-file-as-html:' + content)
})

ipc.on('full-screen', evt => {
    mainWindow.setFullScreen(mainWindow.isFullScreen() ? false : true)
})

function openDialog() {
    dialog.showOpenDialog({
        options: {
            title: 'Test'
        }
    })
}
