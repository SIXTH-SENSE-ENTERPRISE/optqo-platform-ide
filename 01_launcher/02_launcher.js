#!/usr/bin/env node

/**
 * GUI Launcher for Modular AI Agent
 * 
 * This script provides options to launch the agent in different modes:
 * - GUI mode with visual interface
 * - CLI mode for command-line usage
 */

import { spawn } from 'child_process';
import path from 'path';

const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
    console.log('\n🚀 Modular AI Agent Launcher');
    console.log('=' .repeat(40));
    console.log('\n📱 INTERFACE OPTIONS:');
    console.log('   gui                    - Launch visual interface (recommended)');
    console.log('   cli [command]          - Use command-line interface');
    console.log('   help                   - Show this help');
    
    console.log('\n💡 QUICK START:');
    console.log('   npm run gui            - Start with visual interface');
    console.log('   npm start              - CLI help');
    console.log('   npm run demo           - CLI demo');
    
    console.log('\n🎯 GUI FEATURES:');
    console.log('   ✅ Visual folder picker');
    console.log('   ✅ Context switching');
    console.log('   ✅ Real-time progress');
    console.log('   ✅ GitHub repository analysis');
    console.log('   ✅ Professional results display');
}

function launchGUI() {
    console.log('🚀 Launching Modular AI Agent GUI...');
    const electronPath = path.join(process.cwd(), 'node_modules', '.bin', 'electron');
    const guiScript = path.join(process.cwd(), 'gui-main.js');
    
    const child = spawn(electronPath, [guiScript], {
        stdio: 'inherit',
        shell: true
    });
    
    child.on('error', (error) => {
        console.error('❌ Failed to launch GUI:', error.message);
        console.log('💡 Try: npm install electron');
    });
}

function launchCLI(cliArgs) {
    console.log('⚡ Launching CLI mode...');
    const mainScript = path.join(process.cwd(), 'main.js');
    
    const child = spawn('node', [mainScript, ...cliArgs], {
        stdio: 'inherit'
    });
    
    child.on('error', (error) => {
        console.error('❌ Failed to launch CLI:', error.message);
    });
}

// Handle commands
switch (command) {
    case 'gui':
        launchGUI();
        break;
        
    case 'cli':
        launchCLI(args.slice(1));
        break;
        
    case 'help':
    case undefined:
        showHelp();
        break;
        
    default:
        console.log(`❌ Unknown command: ${command}`);
        showHelp();
        break;
}
