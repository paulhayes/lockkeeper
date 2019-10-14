# Lockkeeper

![](img/LockkeeperTitleBlack.png)
![](img/LockkeeperBlack.png)

Lockkeeper is an open source ( GPL v3.0 License )[License.md] application intended to provide Escape Room creators and easy to use off the shelf tool for developing, controlling and deploying their projects.

It's features include 
* Dashboard
* Timer
* Logging
* Force unlocks
* Communication checking

## To Use

Alpha releases will be available soon. Alternatively you can clone and build the project yourself.

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/dceejay/electron-node-red.git
# Go into the repository
cd electron-node-red
# Install dependencies and run the app
npm install && npm run clean && npm start
```

## TL:DR - building runtimes

On OSX you can run `./buildall` to build binaries of "everything"... maybe...

Run `npm run pack` to create packages for all platforms - these are the files required to run, they are not binary installers.

Builds are created in the `build` directory. Runtimes are created in the `../electron-bin` directory.

**Note**: this was written to work on a Mac... other tools may/will be needed on other platforms.

## Packaging your application

If you want to distribute executables of this project, the easiest way is to use electron-packager:

```
sudo npm install -g electron-packager

# build for OSX 64 bits
electron-packager . Node-RED --icon=nodered.icns --platform=darwin --arch=x64 --out=build --overwrite

# build for Windows 64 bits
electron-packager . Node-RED --icon=nodered.icns --platform=win32 --arch=x64  --out=build --asar=true --overwrite --win32metadata.CompanyName='IBM Corp.' --win32metadata.ProductName='Node-RED Electron'

# build for Linux 64 bits
electron-packager . Node-RED --icon=nodered.icns --platform=linux --arch=x64 --out=build --overwrite
```

Learn more about Electron and its API in the [documentation](http://electron.atom.io/docs/latest).


### To package as a dmg

`npm run build:osx`

look at `https://github.com/LinusU/node-appdmg`

    sudo npm install -g appdmg

    appdmg appdmg.json ~/Desktop/NodeRED.dmg


### To package as a deb

`npm run build:linux64` or `npm run build:linux32` - for Intel Linux

Look at `https://github.com/jordansissel/fpm`

    fpm -s dir -t deb -f -n node-red-electron -v 0.16.2 -m your-email@example.com -a i386 Node-RED-linux-ia32/
    fpm -s dir -t deb -f -n node-red-electron -v 0.16.2 -m your-email@example.com -a x86_64 Node-RED-linux-x64/

Use **sudo dpkg -i ...*** to install the correct deb for your architecture.

Use `Node-RED` command to run. Flows are stored in `~/.node-red`.


### To package as an exe

`npm run build:win32` - to build for 32-bit Windows.

`npm run build:win64` - to build for 64-bit Windows.

**Note**: This project was built to run on Mac OSX - To build for windows on other platforms you may need to use other tools.


## License [CC0 (Public Domain)](LICENSE.md)

## See also
 - **Stand-alone Starter Project** - https://github.com/dceejay/node-red-project-starter
 - **Bluemix Starter Project** - https://github.com/dceejay/node-red-bluemix-starter
