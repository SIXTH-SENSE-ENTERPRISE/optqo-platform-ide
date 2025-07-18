#!/usr/bin/env node

/**
 * GUI Launcher for optqo Platform
 * Provides options to start Electron GUI or Web GUI
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GUILauncher {
    constructor() {
        this.projectRoot = path.dirname(__dirname);
    }

    showHelp() {
        console.log(`
🖥️  optqo Platform GUI Launcher
================================

Available Commands:
  electron, e    Start Electron desktop GUI
  web, w         Start web-based GUI in browser  
  both, b        Start both Electron and Web GUI
  help, h        Show this help message

Usage Examples:
  node 16_scripts/gui_launcher.js electron
  node 16_scripts/gui_launcher.js web
  node 16_scripts/gui_launcher.js both

Quick Start:
  npm run gui        (Electron GUI)
  npm run gui-web    (Web GUI)
        `);
    }

    async startElectronGUI() {
        console.log('🖥️  Starting Electron Desktop GUI...');
        
        try {
            const electronProcess = spawn('electron', ['14_gui/03_main.cjs'], {
                cwd: this.projectRoot,
                detached: true,
                stdio: 'ignore'
            });
            
            electronProcess.unref();
            console.log('✅ Electron GUI started successfully!');
            console.log('🔧 If GUI doesn\'t appear, check if Electron is installed: npm list electron');
            
        } catch (error) {
            console.error('❌ Failed to start Electron GUI:', error.message);
            console.log('💡 Try installing Electron: npm install electron');
        }
    }

    async startWebGUI() {
        console.log('🌐 Starting Web GUI Server...');
        
        try {
            const webProcess = spawn('node', ['16_scripts/start_web_gui.js'], {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });
            
            console.log('✅ Web GUI server started!');
            
            // Auto-open browser after a moment
            setTimeout(() => {
                console.log('🌍 Opening browser...');
                const openCommand = process.platform === 'win32' ? 'start' : 
                                  process.platform === 'darwin' ? 'open' : 'xdg-open';
                
                spawn(openCommand, ['http://localhost:3000'], {
                    detached: true,
                    stdio: 'ignore'
                }).unref();
            }, 2000);
            
        } catch (error) {
            console.error('❌ Failed to start Web GUI:', error.message);
        }
    }

    async startBoth() {
        console.log('🚀 Starting both Electron and Web GUI...');
        await this.startElectronGUI();
        setTimeout(() => this.startWebGUI(), 1000);
    }

    async run() {
        const command = process.argv[2]?.toLowerCase();
        
        switch (command) {
            case 'electron':
            case 'e':
                await this.startElectronGUI();
                break;
                
            case 'web':
            case 'w':
                await this.startWebGUI();
                break;
                
            case 'both':
            case 'b':
                await this.startBoth();
                break;
                
            case 'help':
            case 'h':
            case undefined:
                this.showHelp();
                break;
                
            default:
                console.log(`❌ Unknown command: ${command}`);
                this.showHelp();
        }
    }
}

// Run the launcher
const launcher = new GUILauncher();
launcher.run();
