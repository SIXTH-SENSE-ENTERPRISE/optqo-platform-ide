# optqo Platform - Frontend Usage Guide

## 🚀 Quick Start

### 1. Start the Web Interface
```bash
source venv/bin/activate
python3 app.py
```

### 2. Open Your Browser
Navigate to: http://localhost:5000

## 📊 Features

### Dashboard (Main Page)
- **Project Management**: View all your analysis projects
- **Quick Actions**: 
  - Upload Repository (zip files or folders)
  - Clone Git Repository (from GitHub, GitLab, etc.)
- **Project History**: Browse previous analyses

### Project Analysis View
- **Real-time Terminal Output**: Live streaming of analysis progress
- **Interactive Flowchart**: Step-by-step progress visualization
- **Agent Status**: Individual specialist agent progress tracking
- **Analysis Results**: Embedded HTML report display

## 🎯 How to Use

### Creating a New Project

#### Option 1: Upload Repository
1. Click "Upload Repository" on dashboard
2. Enter project name and description
3. Drag & drop zip file or click to browse
4. Click "Create Project"

#### Option 2: Clone Git Repository
1. Click "Clone Git Repository" on dashboard
2. Enter project name and repository URL
3. Click "Clone & Create Project"

### Running Analysis
1. Open any project from the dashboard
2. Click "🚀 Start Analysis" button
3. Watch real-time progress in:
   - **Terminal**: Live command output
   - **Flowchart**: Visual step tracking
   - **Agent Progress**: Individual specialist status

### Viewing Results
- Results automatically appear when analysis completes
- Interactive HTML report embedded in the page
- Full optqo-branded professional report

## 📁 Project Structure
```
projects/
├── project_1_[uuid]/
│   ├── repository/          # Your uploaded/cloned code
│   ├── logs/               # Analysis logs (JSON)
│   ├── reports/            # Generated HTML reports
│   └── metadata.json       # Project information
└── project_2_[uuid]/
    └── ...
```

## 🎭 Analysis Flow

### Phase 1: Repository Discovery & Chunking
- Scans and catalogs all files
- Prepares content for specialist agents

### Phase 2: Enhanced Specialist Crew Analysis (6 Agents)
1. **Technology Detection Agent**: Identifies tech stack
2. **Code Quality Agent**: Analyzes code quality metrics
3. **Architecture & Data Flow Agent**: Maps system architecture
4. **File Structure Agent**: Evaluates organization
5. **Business Context Agent**: Assesses business impact
6. **Performance Analysis Agent**: Reviews performance aspects

### Phase 3: Professional Report Generation
- Synthesizes all agent findings
- Generates comprehensive HTML report
- Applies optqo professional branding

## 🔧 Advanced Features

### Terminal Controls
- **Collapse/Expand**: Toggle terminal visibility
- **Clear**: Clear terminal output
- **Auto-scroll**: Automatically follows latest output

### Project Management
- **Delete Projects**: Remove projects and all data
- **Project History**: Browse all past analyses
- **Status Tracking**: Monitor project lifecycle

### WebSocket Integration
- Real-time communication between backend and frontend
- Live progress updates without page refresh
- Instant terminal output streaming

## 🛠️ Technical Details

### Backend Architecture
- **Flask**: Web framework
- **Flask-SocketIO**: Real-time WebSocket communication
- **Project Isolation**: Each project in separate directory
- **Process Management**: Background analysis execution

### Frontend Architecture
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: WebSocket-based live updates
- **Professional UI**: Based on optqo design system
- **Interactive Elements**: Live flowchart and terminal

## 🔍 Troubleshooting

### Analysis Not Starting
- Check that repository contains files
- Verify virtual environment is activated
- Check terminal output for errors

### WebSocket Connection Issues
- Refresh the page
- Check browser console for errors
- Ensure Flask server is running

### File Upload Problems
- Ensure file is valid zip format
- Check file size limits
- Verify network connection

## 📈 Next Steps

The system is designed to be:
- **Scalable**: Easy to add new agent types
- **Extensible**: Simple to modify UI components  
- **Maintainable**: Clean separation of concerns
- **User-friendly**: Intuitive interface design

Enjoy analyzing your repositories with optqo Platform! 🎉 