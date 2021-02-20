const {app, BrowserWindow} = require('electron');
const RPC = require('discord-rpc');
const path = require("path");

const CLIENT_ID = '812338041582649374';
const rpc = new RPC.Client({ transport: 'ipc' });
const state = require('./lib/enums/states.json');

let flash_plugin = null;
switch (process.platform) {
    case 'win32':
        flash_plugin = `lib/flash/pepflashplayer64_32_0_0_303.dll`
        break;
    case 'darwin':
        flash_plugin = `lib/flash/PepperFlashPlayer.plugin`
        break;
    case 'linux':
        flash_plugin = `lib/flash/libpepflashplayer.so`
        break;
}
app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, flash_plugin));
const TIMESTAMP = new Date();

function createWindow() {
    let splash = new BrowserWindow(
        {width: 512,
            height: 512,
            icon: `${__dirname}/lib/img/icon.ico`,
            transparent: true,
            frame: false,
            alwaysOnTop: true
        });
    splash.loadFile(`${__dirname}/lib/splash.html`).then(() => console.log('loaded splash.'));
    const win = new BrowserWindow({
        width: 1120,
        height: 720,
        icon: `${__dirname}/lib/img/icon.ico`,
        webPreferences: {
            plugins: true,
        },
        show: false
    })

    win.setMenu(null);
    win.webContents.session.clearCache().then(() => {
        console.log('Cleared cache.');

        win.loadURL(`https://play.antiquepengu.in/`).then(() => {
            win.webContents.executeJavaScript('window.scrollTo(0,55)').then(() => {
                splash.destroy();
                win.show();

                rpc.login({clientId: CLIENT_ID}).catch(() => console.log('RPC timed out...'));

                setInterval(async () => {
                    let room = await win.webContents.executeJavaScript('current_room').catch(() => console.log('current_room not found.'));
                    if(!room) return;

                    rpc.setActivity({
                        largeImageKey: "main-logo",
                        startTimestamp: TIMESTAMP,
                        state: state[room]
                    }).catch(e => console.log(e));
                }, 1000)
            })
        }).catch(e => console.log(e));
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
})

app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
})

rpc.on('ready', () => {
    rpc.setActivity({
        largeImageKey: "main-logo",
        startTimestamp: TIMESTAMP,
        state: "admiring the menu."
    }).catch(e => console.log(e));

    console.log('Rich presence is ready.');
})