<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Modular AI Agent - Copilot Instructions

## Project Overview
This is a configuration-driven AI agent with modular architecture for code analysis, optimization, and intelligent automation.

## Architecture Principles
- **Configuration-Driven**: Behavior is controlled by external JSON configuration files
- **Modular Design**: Independent activity modules that can be composed into pipelines
- **Context Switching**: Different analysis contexts (financial, optimization, general) without code changes
- **Template-Based**: External templates for HTML/Markdown report generation
- **ES6 Modules**: Use import/export syntax throughout the project

## Key Components
- **Core Engine** (`01_core/`): Orchestration and context management
- **Activities** (`02_activities/`): Independent analysis modules (analyze, organize, optimize, transform, document)
- **Prompts** (`03_prompts/`): External AI prompts stored as JSON files
- **Templates** (`04_templates/`): HTML/Markdown templates for reports
- **Configuration** (`05_config/`): Context definitions and behavior settings

## Coding Guidelines
- Use ES6 modules with proper import/export
- Maintain separation of concerns between modules
- Configuration should be external (JSON files)
- Activities should be independent and composable
- Use descriptive variable names and comprehensive error handling
- Follow async/await patterns for asynchronous operations

## File Organization
- Keep activities focused and single-purpose
- Store all prompts as external JSON files
- Use templates for all output generation
- Configuration files control behavior, not code

## When Adding Features
- New contexts go in `05_config/agent-contexts.json`
- New activities go in `02_activities/` as independent modules
- New prompts go in `03_prompts/` as JSON files
- New templates go in `04_templates/` with Handlebars syntax
