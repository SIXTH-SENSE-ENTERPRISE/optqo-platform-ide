#!/usr/bin/env python3
"""
optqo Platform - Web Interface
Flask application with WebSocket support for real-time analysis
"""

import os
import sys
import json
import uuid
import shutil
import asyncio
import subprocess
import threading
from datetime import datetime
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_file
from flask_socketio import SocketIO, emit
import zipfile
import tempfile

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

# Import git clone function
from git_clone_function import clone_repo

app = Flask(__name__)
app.config['SECRET_KEY'] = 'optqo-platform-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables
current_analysis = None
projects_dir = Path("projects")
projects_dir.mkdir(exist_ok=True)

class AnalysisRunner:
    def __init__(self, project_id, repo_path):
        self.project_id = project_id
        self.repo_path = repo_path
        self.process = None
        self.thread = None
        
    def find_actual_repo_path(self):
        """Find the actual repository path, handling Git clone subdirectories"""
        repo_path = Path(self.repo_path)
        
        # Check if there's a single subdirectory (common with Git clones)
        if repo_path.exists():
            subdirs = [d for d in repo_path.iterdir() if d.is_dir() and not d.name.startswith('.')]
            if len(subdirs) == 1:
                # Check if the subdirectory contains the actual files
                subdir = subdirs[0]
                files = list(subdir.glob('*'))
                if files:  # If subdirectory has files, use it
                    return str(subdir)
        
        return self.repo_path
        
    def setup_project_environment(self):
        """Set up environment variables for the analysis to use project-specific paths"""
        project_path = projects_dir / self.project_id
        
        # Set environment variables to redirect logs and reports
        env = os.environ.copy()
        env['OPTQO_PROJECT_ID'] = self.project_id
        env['OPTQO_LOG_DIR'] = str(project_path / "logs")
        env['OPTQO_REPORTS_DIR'] = str(project_path / "reports")
        
        return env
        
    def run_analysis(self):
        """Run the analysis in a separate thread with real-time output streaming"""
        try:
            # Find the actual repository path
            actual_repo_path = self.find_actual_repo_path()
            
            socketio.emit('terminal_output', {
                'project_id': self.project_id,
                'output': f'🔍 Repository path: {actual_repo_path}',
                'timestamp': datetime.now().isoformat()
            })
            
            # Set up project environment
            env = self.setup_project_environment()
            
            # Build command - run from main project directory
            cmd = f"source venv/bin/activate && python3 main_enhanced_crew.py '{actual_repo_path}'"
            
            socketio.emit('terminal_output', {
                'project_id': self.project_id,
                'output': f'🚀 Starting analysis with command: {cmd}',
                'timestamp': datetime.now().isoformat()
            })
            
            # Run from the main project directory (where venv and main_enhanced_crew.py are)
            working_dir = Path(__file__).parent
            
            self.process = subprocess.Popen(
                cmd,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1,
                cwd=str(working_dir),
                env=env
            )
            
            # Stream output line by line
            for line in iter(self.process.stdout.readline, ''):
                if line:
                    line_stripped = line.strip()
                    socketio.emit('terminal_output', {
                        'project_id': self.project_id,
                        'output': line_stripped,
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    # Parse step information for flowchart updates
                    self.parse_step_info(line_stripped)
            
            self.process.wait()
            
            # Move generated files to project directory if they exist in main directories
            self.move_generated_files()
            
            # Analysis complete
            socketio.emit('analysis_complete', {
                'project_id': self.project_id,
                'success': self.process.returncode == 0,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            socketio.emit('analysis_error', {
                'project_id': self.project_id,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
    
    def move_generated_files(self):
        """Move generated log and report files to project-specific directories"""
        try:
            project_path = projects_dir / self.project_id
            main_project_dir = Path(__file__).parent
            
            # Move logs from main log/ directory to project logs/
            main_log_dir = main_project_dir / "log"
            project_log_dir = project_path / "logs"
            
            if main_log_dir.exists():
                for log_file in main_log_dir.glob("*"):
                    if log_file.is_file():
                        # Check if it's a recent file (within last 5 minutes)
                        file_time = datetime.fromtimestamp(log_file.stat().st_mtime)
                        if (datetime.now() - file_time).total_seconds() < 300:
                            dest_file = project_log_dir / log_file.name
                            shutil.copy2(log_file, dest_file)
                            socketio.emit('terminal_output', {
                                'project_id': self.project_id,
                                'output': f'📁 Moved log: {log_file.name}',
                                'timestamp': datetime.now().isoformat()
                            })
            
            # Move reports from main reports/ directory to project reports/
            main_reports_dir = main_project_dir / "reports"
            project_reports_dir = project_path / "reports"
            
            if main_reports_dir.exists():
                for report_file in main_reports_dir.glob("*.html"):
                    if report_file.is_file():
                        # Check if it's a recent file (within last 5 minutes)
                        file_time = datetime.fromtimestamp(report_file.stat().st_mtime)
                        if (datetime.now() - file_time).total_seconds() < 300:
                            dest_file = project_reports_dir / report_file.name
                            shutil.copy2(report_file, dest_file)
                            socketio.emit('terminal_output', {
                                'project_id': self.project_id,
                                'output': f'📊 Generated report: {report_file.name}',
                                'timestamp': datetime.now().isoformat()
                            })
                            
        except Exception as e:
            socketio.emit('terminal_output', {
                'project_id': self.project_id,
                'output': f'⚠️ Warning: Could not move files: {str(e)}',
                'timestamp': datetime.now().isoformat()
            })
    
    def parse_step_info(self, line):
        """Parse terminal output to update flowchart progress"""
        step_mappings = {
            'Phase 1: Repository Discovery & Chunking': 'discovery',
            'Discovery complete': 'discovery_complete',
            'Phase 2: Enhanced Specialist Crew Analysis': 'crew_analysis',
            'technology_detection_agent': 'technology_detection',
            'code_quality_agent': 'code_quality', 
            'architecture_dataflow_agent': 'architecture_dataflow',
            'file_structure_agent': 'file_structure',
            'business_context_agent': 'business_context',
            'performance_analysis_agent': 'performance_analysis',
            'Parallel execution complete': 'crew_complete',
            'Phase 3: Professional Report Generation': 'report_generation',
            'Enhanced report saved': 'report_complete'
        }
        
        for keyword, step in step_mappings.items():
            if keyword in line:
                socketio.emit('step_update', {
                    'project_id': self.project_id,
                    'step': step,
                    'status': 'active' if 'starting' in line.lower() or 'phase' in line.lower() else 'complete',
                    'timestamp': datetime.now().isoformat()
                })
                break

def get_project_metadata(project_id):
    """Get project metadata"""
    project_path = projects_dir / project_id
    metadata_file = project_path / "metadata.json"
    
    if metadata_file.exists():
        with open(metadata_file, 'r') as f:
            return json.load(f)
    return None

def save_project_metadata(project_id, metadata):
    """Save project metadata"""
    project_path = projects_dir / project_id
    project_path.mkdir(exist_ok=True)
    
    metadata_file = project_path / "metadata.json"
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)

def get_all_projects():
    """Get all projects with their metadata"""
    projects = []
    for project_dir in projects_dir.iterdir():
        if project_dir.is_dir():
            metadata = get_project_metadata(project_dir.name)
            if metadata:
                projects.append({
                    'id': project_dir.name,
                    'metadata': metadata
                })
    
    # Sort by creation time (newest first)
    projects.sort(key=lambda x: x['metadata'].get('created_at', ''), reverse=True)
    return projects

@app.route('/')
def index():
    """Main dashboard"""
    return render_template('index.html')

@app.route('/project/<project_id>')
def project_view(project_id):
    """Individual project view"""
    metadata = get_project_metadata(project_id)
    if not metadata:
        return "Project not found", 404
    
    return render_template('project.html', project_id=project_id, metadata=metadata)

@app.route('/api/projects', methods=['GET'])
def api_get_projects():
    """API endpoint to get all projects"""
    return jsonify(get_all_projects())

@app.route('/api/projects', methods=['POST'])
def api_create_project():
    """API endpoint to create a new project"""
    data = request.json
    project_id = str(uuid.uuid4())
    
    # Create project directory structure
    project_path = projects_dir / project_id
    project_path.mkdir(exist_ok=True)
    (project_path / "repository").mkdir(exist_ok=True)
    (project_path / "logs").mkdir(exist_ok=True)
    (project_path / "reports").mkdir(exist_ok=True)
    
    # Save metadata
    metadata = {
        'id': project_id,
        'name': data.get('name', f'Project {project_id[:8]}'),
        'description': data.get('description', ''),
        'created_at': datetime.now().isoformat(),
        'status': 'created',
        'source_type': data.get('source_type', 'unknown'),
        'source_info': data.get('source_info', {})
    }
    
    save_project_metadata(project_id, metadata)
    
    return jsonify({'project_id': project_id, 'metadata': metadata})

@app.route('/api/projects/<project_id>/upload', methods=['POST'])
def api_upload_files(project_id):
    """API endpoint to upload files to a project"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    project_path = projects_dir / project_id
    if not project_path.exists():
        return jsonify({'error': 'Project not found'}), 404
    
    repo_path = project_path / "repository"
    
    try:
        # Handle zip file upload
        if file.filename.endswith('.zip'):
            with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as tmp_file:
                file.save(tmp_file.name)
                
                # Extract zip file
                with zipfile.ZipFile(tmp_file.name, 'r') as zip_ref:
                    zip_ref.extractall(repo_path)
                
                os.unlink(tmp_file.name)
        else:
            # Save single file
            file.save(repo_path / file.filename)
        
        # Update project metadata
        metadata = get_project_metadata(project_id)
        metadata['status'] = 'uploaded'
        metadata['uploaded_at'] = datetime.now().isoformat()
        save_project_metadata(project_id, metadata)
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/<project_id>/clone', methods=['POST'])
def api_clone_repo(project_id):
    """API endpoint to clone a git repository"""
    data = request.json
    repo_url = data.get('repo_url')
    
    if not repo_url:
        return jsonify({'error': 'Repository URL is required'}), 400
    
    project_path = projects_dir / project_id
    if not project_path.exists():
        return jsonify({'error': 'Project not found'}), 404
    
    repo_path = project_path / "repository"
    
    try:
        # Clone repository
        success = clone_repo(repo_url, str(repo_path))
        
        if success:
            # Update project metadata
            metadata = get_project_metadata(project_id)
            metadata['status'] = 'cloned'
            metadata['cloned_at'] = datetime.now().isoformat()
            metadata['source_info']['repo_url'] = repo_url
            save_project_metadata(project_id, metadata)
            
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Failed to clone repository'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/<project_id>/analyze', methods=['POST'])
def api_start_analysis(project_id):
    """API endpoint to start analysis"""
    global current_analysis
    
    project_path = projects_dir / project_id
    if not project_path.exists():
        return jsonify({'error': 'Project not found'}), 404
    
    repo_path = project_path / "repository"
    if not repo_path.exists() or not any(repo_path.iterdir()):
        return jsonify({'error': 'No repository data found'}), 400
    
    # Check if analysis is already running
    if current_analysis and current_analysis.process and current_analysis.process.poll() is None:
        return jsonify({'error': 'Analysis already running'}), 409
    
    try:
        # Update project status
        metadata = get_project_metadata(project_id)
        metadata['status'] = 'analyzing'
        metadata['analysis_started_at'] = datetime.now().isoformat()
        save_project_metadata(project_id, metadata)
        
        # Start analysis
        current_analysis = AnalysisRunner(project_id, str(repo_path))
        current_analysis.thread = threading.Thread(target=current_analysis.run_analysis)
        current_analysis.thread.start()
        
        return jsonify({'success': True, 'message': 'Analysis started'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/<project_id>/report')
def api_get_report(project_id):
    """API endpoint to get the generated report"""
    project_path = projects_dir / project_id
    reports_path = project_path / "reports"
    
    if not reports_path.exists():
        return jsonify({'error': 'No reports found'}), 404
    
    # Find the latest report
    report_files = list(reports_path.glob("*.html"))
    if not report_files:
        return jsonify({'error': 'No HTML reports found'}), 404
    
    latest_report = max(report_files, key=lambda x: x.stat().st_mtime)
    return send_file(latest_report, as_attachment=False)

@app.route('/api/projects/<project_id>/delete', methods=['DELETE'])
def api_delete_project(project_id):
    """API endpoint to delete a project"""
    project_path = projects_dir / project_id
    
    if not project_path.exists():
        return jsonify({'error': 'Project not found'}), 404
    
    try:
        shutil.rmtree(project_path)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection"""
    print('Client connected')
    emit('connected', {'data': 'Connected to optqo Platform'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    print('Client disconnected')

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    templates_dir = Path("templates")
    templates_dir.mkdir(exist_ok=True)
    
    print("🌐 Starting optqo Platform Web Interface")
    print("📊 Dashboard: http://localhost:5000")
    
    socketio.run(app, debug=True, host='0.0.0.0', port=5000) 