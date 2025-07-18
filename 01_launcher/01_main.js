import ModularAIAgent from './01_core/modular-agent.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Main CLI Entry Point for Modular AI Agent
 * 
 * Provides command-line interface for context switching,
 * activity execution, and pipeline management.
 */

class AgentCLI {
    constructor() {
        this.agent = new ModularAIAgent();
        this.initialized = false;
    }

    async run() {
        const args = process.argv.slice(2);
        const command = args[0];

        try {
            switch (command) {
                case 'init':
                    await this.handleInit(args[1]);
                    break;

                case 'switch':
                    await this.handleSwitch(args[1]);
                    break;

                case 'contexts':
                    await this.handleContexts();
                    break;

                case 'analyze':
                    await this.handleActivity('analyze', args[1], args.slice(2));
                    break;

                case 'organize':
                    await this.handleActivity('organize', args[1], args.slice(2));
                    break;

                case 'optimize':
                    await this.handleActivity('optimize', args[1], args.slice(2));
                    break;

                case 'transform':
                    await this.handleActivity('transform', args[1], args.slice(2));
                    break;

                case 'document':
                    await this.handleActivity('document', args[1], args.slice(2));
                    break;

                case 'clone':
                    await this.handleClone(args[1], args.slice(2));
                    break;

                case 'clone-analyze':
                    await this.handleCloneAndAnalyze(args[1], args.slice(2));
                    break;

                case 'pipeline':
                    await this.handlePipeline(args[1], args.slice(2));
                    break;

                case 'status':
                    await this.handleStatus();
                    break;

                case 'help':
                default:
                    this.showHelp();
                    break;
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    }

    async ensureInitialized() {
        if (!this.initialized) {
            console.log('🔄 Auto-initializing with default context...');
            await this.agent.initialize();
            this.initialized = true;
        }
    }

    async handleInit(contextName) {
        console.log('🚀 Initializing Modular AI Agent...');
        
        if (!contextName) {
            console.log('📋 Available contexts:');
            await this.agent.initialize(); // Initialize to load config
            const contexts = this.agent.getAvailableContexts();
            contexts.forEach(ctx => {
                console.log(`   ${ctx.name}: ${ctx.description}`);
            });
            console.log('\nUsage: node main.js init <context-name>');
            return;
        }

        const success = await this.agent.initialize(contextName);
        if (success) {
            this.initialized = true;
            console.log('\n📊 Current Configuration:');
            const currentContext = this.agent.getCurrentContext();
            console.log(`   Context: ${currentContext.name}`);
            console.log(`   Description: ${currentContext.description}`);
            console.log(`   Focus Areas: ${currentContext.focus.join(', ')}`);
            console.log(`   Enabled Activities: ${currentContext.enabledActivities.join(', ')}`);
        }
    }

    async handleSwitch(contextName) {
        if (!contextName) {
            console.log('Usage: node main.js switch <context-name>');
            return;
        }

        await this.ensureInitialized();
        await this.agent.switchContext(contextName);
        
        const currentContext = this.agent.getCurrentContext();
        console.log(`✅ Switched to: ${currentContext.name}`);
        console.log(`   Enabled Activities: ${currentContext.enabledActivities.join(', ')}`);
    }

    async handleContexts() {
        await this.ensureInitialized();
        const contexts = this.agent.getAvailableContexts();
        
        console.log('\n🎯 Available Contexts:');
        contexts.forEach(ctx => {
            console.log(`\n   ${ctx.name}`);
            console.log(`   Description: ${ctx.description}`);
            console.log(`   Focus: ${ctx.focus.join(', ')}`);
        });

        console.log('\n📊 Current Context:');
        const current = this.agent.getCurrentContext();
        if (current) {
            console.log(`   ${current.name}: ${current.description}`);
        } else {
            console.log('   None (not initialized)');
        }
    }

    async handleActivity(activityName, inputPath, options) {
        if (!inputPath) {
            console.log(`Usage: node main.js ${activityName} <input-path> [options]`);
            return;
        }

        await this.ensureInitialized();
        
        const parsedOptions = this.parseOptions(options);
        const result = await this.agent.runActivity(activityName, inputPath, parsedOptions);
        
        console.log(`\n✅ ${activityName} activity completed`);
        if (result.summary) {
            console.log('📊 Summary:');
            Object.entries(result.summary).forEach(([key, value]) => {
                console.log(`   ${key}: ${value}`);
            });
        }
    }

    async handlePipeline(inputPath, options) {
        if (!inputPath) {
            console.log('Usage: node main.js pipeline <input-path> [options]');
            return;
        }

        await this.ensureInitialized();
        
        const parsedOptions = this.parseOptions(options);
        const results = await this.agent.runPipeline(inputPath, parsedOptions);
        
        console.log('\n🎉 Pipeline execution completed');
        console.log('📊 Summary:');
        Object.keys(results).forEach(activity => {
            const status = results[activity].success ? '✅' : '❌';
            console.log(`   ${activity}: ${status}`);
        });
    }

    async handleStatus() {
        await this.ensureInitialized();
        
        const context = this.agent.getCurrentContext();
        console.log('\n📊 Agent Status:');
        console.log(`   Context: ${context.name}`);
        console.log(`   Description: ${context.description}`);
        console.log(`   Focus Areas: ${context.focus.join(', ')}`);
        console.log(`   Enabled Activities: ${context.enabledActivities.join(', ')}`);
        console.log(`   Initialized: ${this.initialized ? '✅' : '❌'}`);
    }

    async handleClone(repoUrl, options) {
        if (!repoUrl) {
            console.log('Usage: node main.js clone <github-url> [options]');
            console.log('Example: node main.js clone https://github.com/username/repo');
            console.log('         node main.js clone username/repo');
            return;
        }

        const parsedOptions = this.parseOptions(options);
        const outputDir = parsedOptions.output || './cloned-repos';
        
        // Normalize GitHub URL
        const repoPath = this.normalizeGitHubUrl(repoUrl);
        const cloneUrl = `https://github.com/${repoPath}.git`;
        const localPath = path.join(outputDir, repoPath.split('/')[1]);

        console.log(`🌐 Cloning repository: ${repoPath}`);
        console.log(`📁 Local path: ${localPath}`);

        try {
            // Create output directory if it doesn't exist
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Clone the repository
            await this.executeCommand(`git clone ${cloneUrl} "${localPath}"`);
            
            console.log(`✅ Repository cloned successfully to: ${localPath}`);
            return localPath;

        } catch (error) {
            console.error(`❌ Failed to clone repository: ${error.message}`);
            throw error;
        }
    }

    async handleCloneAndAnalyze(repoUrl, options) {
        if (!repoUrl) {
            console.log('Usage: node main.js clone-analyze <github-url> [options]');
            console.log('Example: node main.js clone-analyze https://github.com/facebook/react');
            console.log('         node main.js clone-analyze microsoft/vscode --depth deep');
            return;
        }

        try {
            // Clone the repository
            const localPath = await this.handleClone(repoUrl, options);
            
            // Initialize agent if needed
            await this.ensureInitialized();
            
            // Analyze the cloned repository
            console.log(`\n🔍 Starting analysis of cloned repository...`);
            const parsedOptions = this.parseOptions(options);
            const result = await this.agent.runActivity('analyze', localPath, parsedOptions);
            
            if (result.success) {
                console.log(`✅ Analysis completed successfully`);
                console.log(`📊 Found ${result.files?.length || 0} files`);
                console.log(`🏢 Business Domain: ${result.summary?.businessDomain || 'Unknown'}`);
                
                if (parsedOptions.output) {
                    console.log(`📄 Results saved to: ${parsedOptions.output}`);
                }
            } else {
                console.error(`❌ Analysis failed: ${result.error}`);
            }

        } catch (error) {
            console.error(`❌ Clone and analyze failed: ${error.message}`);
        }
    }

    normalizeGitHubUrl(input) {
        // Handle different GitHub URL formats
        if (input.includes('github.com')) {
            // Extract repo path from full URL
            const match = input.match(/github\.com\/([^\/]+\/[^\/]+)/);
            return match ? match[1].replace('.git', '') : input;
        } else if (input.includes('/')) {
            // Already in username/repo format
            return input;
        } else {
            throw new Error('Invalid GitHub URL format. Use: username/repo or https://github.com/username/repo');
        }
    }

    async executeCommand(command) {
        try {
            const { stdout, stderr } = await execAsync(command);
            return stdout;
        } catch (error) {
            throw error;
        }
    }

    parseOptions(options) {
        const parsed = {};
        
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            
            if (option.startsWith('--')) {
                const key = option.substring(2);
                const value = options[i + 1] && !options[i + 1].startsWith('--') ? options[++i] : true;
                parsed[key] = value;
            }
        }
        
        return parsed;
    }

    showHelp() {
        console.log('\n🤖 Modular AI Agent - Configuration-Driven Architecture');
        console.log('=' .repeat(60));
        console.log('\n📖 COMMANDS:');
        console.log('   init <context>                 - Initialize with specific context');
        console.log('   switch <context>               - Switch to different context');
        console.log('   contexts                       - List available contexts');
        console.log('   analyze <path> [options]       - Run analysis activity');
        console.log('   organize <path> [options]      - Run organization activity');
        console.log('   optimize <path> [options]      - Run optimization activity');
        console.log('   transform <path> [options]     - Run transformation activity');
        console.log('   document <path> [options]      - Run documentation activity');
        console.log('   clone <github-url> [options]   - Clone GitHub repository');
        console.log('   clone-analyze <github-url>     - Clone and analyze GitHub repository');
        console.log('   pipeline <path> [options]      - Run complete pipeline');
        console.log('   status                         - Show current context and activities');
        console.log('   help                           - Show this help');
        console.log('   pipeline <path> [options]      - Run complete pipeline');
        console.log('   status                         - Show current context and activities');
        console.log('   help                           - Show this help');

        console.log('\n🎯 CONTEXT EXAMPLES:');
        console.log('   data-scientist                 - For business context analysis');
        console.log('   data-engineer                  - For data pipeline and ETL analysis');
        console.log('   analytics-professional         - For business analytics and reporting');

        console.log('\n🔧 OPTIONS:');
        console.log('   --output <path>                - Specify output directory');
        console.log('   --format <format>              - Output format (json, html, markdown)');
        console.log('   --depth <level>                - Analysis depth (shallow, standard, deep)');
        console.log('   --stop-on-error                - Stop pipeline on first error');

        console.log('\n💡 USAGE EXAMPLES:');
        console.log('   node main.js init data-scientist');
        console.log('   node main.js analyze ./my-project --depth deep');
        console.log('   node main.js pipeline ./my-project --output ./reports');
        console.log('   node main.js switch data-engineer');
        console.log('   node main.js status');

        console.log('\n🌐 GITHUB EXAMPLES:');
        console.log('   node main.js clone facebook/react');
        console.log('   node main.js clone https://github.com/microsoft/vscode');
        console.log('   node main.js clone-analyze tensorflow/tensorflow --depth deep');
        console.log('   node main.js clone-analyze username/repo --output ./analysis');

        console.log('\n📁 PROJECT STRUCTURE:');
        console.log('   01_core/           - Core agent engine');
        console.log('   02_activities/     - Independent activity modules');
        console.log('   03_prompts/        - AI prompts & instructions');
        console.log('   04_templates/      - Output templates');
        console.log('   05_config/         - Configuration files');
        console.log('   07_outputs/        - Generated outputs');

        console.log('\n🎯 KEY FEATURES:');
        console.log('   ✅ Configuration-driven behavior');
        console.log('   ✅ Independent activity execution');
        console.log('   ✅ Context switching without restart');
        console.log('   ✅ Template-based outputs');
        console.log('   ✅ Scalable pipeline architecture');
    }
}

// Run the CLI
const cli = new AgentCLI();
cli.run().catch(console.error);
