const { app, BrowserWindow, Menu } = require('electron')
const discordRpc = require('discord-rpc')
const path = require('path')
const config = require('../config.json')

require('update-electron-app')({ repo: config.repositoryName })

if (require('electron-squirrel-startup')) {
	app.quit()

	return
}

const appStart = Date.now()
const discordApplicationId = config.discordRpc.discordAppId
const mainURL = config.mainURL
const pluginPaths = {
	win32: path.join(path.dirname(__dirname), 'lib/pepflashplayer.dll'),
	darwin: path.join(path.dirname(__dirname), 'lib/PepperFlashPlayer.plugin'),
	linux: path.join(path.dirname(__dirname), 'lib/libpepflashplayer.so')
}

let rpc
if (config.discordRpc.enable) {
	discordRpc.register(discordApplicationId)
	rpc = new discordRpc.Client({ transport: 'ipc' })
}

if (process.platform === 'linux') app.commandLine.appendSwitch('no-sandbox')
const pluginName = pluginPaths[process.platform]

app.commandLine.appendSwitch('ppapi-flash-path', pluginName)
app.commandLine.appendSwitch('ppapi-flash-version', '31.0.0.122')
app.commandLine.appendSwitch('ignore-certificate-errors')
app.setAboutPanelOptions({
	// Tää on ihan vitun purkka paskaa :D
	applicationName: 'Komlio Client\n\nWebsite:\nhotelli.komlio.xyz\n\nCredits:\n- J3-rmu\n\nVersion:',
	copyright: '\n© 2023 Hotelli Komlio',
	iconPath: path.join(__dirname, '../lib/icons/icon.png')
})

const createWindow = () => {
	const mainWindow = new BrowserWindow({
		width: config.windowSettings.width,
		height: config.windowSettings.height,
		//autoHideMenuBar: true,
		useContentSize: true,
		webPreferences: {
			plugins: true
		}
	})

	
	mainWindow.loadURL(mainURL)
	mainWindow.maximize()
	let menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

	if (rpc) {
		rpc.on('ready', () => {
			rpc.setActivity({
				details: config.discordRpc.activityTitle,
				state: config.discordRpc.activityDescription,
				startTimestamp: appStart,
				largeImageKey: 'large',
				buttons: config.discordRpc.buttons
			}).catch(function () {})
		})
	}
}

let menuTemplate = [
    {
        label: "Exit?",
        submenu: [
			
            { role: 'quit' }
        ]
    },
    {
      label : "View",
            submenu : [
				{ role: 'reload' },
				{ role: 'forceReload' },
				{ type: 'separator' },
				{ role: 'resetZoom' },
				{ role: 'zoomIn' },
				{ role: 'zoomOut' },
				{ type: 'separator' },
				{ role: 'togglefullscreen' },
				{ type: 'separator' },
				{ role: 'about' },
        ]
    }
];

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (rpc && rpc.user) rpc.destroy()

	if (process.platform !== 'darwin') {
		app.quit()

		process.exit(0)
	}
})
