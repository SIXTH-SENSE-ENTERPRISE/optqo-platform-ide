#!/usr/bin/env python3
"""
Progress Emitter for optqo Platform
Allows backend processes to emit progress updates for real-time UI updates
"""

import os
import json
from pathlib import Path
from datetime import datetime


def emit_progress(step, status, details=None):
    """
    Emit progress update for the current analysis
    
    Args:
        step (str): The analysis step (e.g., 'discovery', 'crew_analysis', 'report_generation')
        status (str): The status ('active', 'complete', 'error') 
        details (dict, optional): Additional details about the progress
    """
    try:
        # Get project ID and progress directory from environment
        project_id = os.getenv('OPTQO_PROJECT_ID')
        progress_dir = os.getenv('OPTQO_PROGRESS_DIR')
        
        if not project_id or not progress_dir:
            return  # Not running in web interface context
        
        progress_file = Path(progress_dir) / f"progress_{project_id}.json"
        
        # Create progress data
        progress_data = {
            'step': step,
            'status': status,
            'timestamp': datetime.now().isoformat(),
            'project_id': project_id
        }
        
        if details:
            progress_data['details'] = details
        
        # Write progress to file
        with open(progress_file, 'w') as f:
            json.dump(progress_data, f)
            
    except Exception:
        # Silently ignore errors - progress emission shouldn't break analysis
        pass


def emit_agent_progress(agent_name, status):
    """
    Emit progress for individual specialist agents
    
    Args:
        agent_name (str): Name of the agent (e.g., 'technology_detection', 'code_quality')
        status (str): Agent status ('active', 'complete', 'error')
    """
    emit_progress(agent_name, status, {'type': 'agent'})


def emit_phase_progress(phase, status, details=None):
    """
    Emit progress for major analysis phases
    
    Args:
        phase (str): Phase name ('discovery', 'crew_analysis', 'report_generation')
        status (str): Phase status ('active', 'complete', 'error')
        details (dict, optional): Additional phase details
    """
    emit_progress(phase, status, {'type': 'phase', **(details or {})})


# Convenience functions for major phases
def start_discovery():
    emit_phase_progress('discovery', 'active')

def complete_discovery(files_found=None):
    details = {'files_found': files_found} if files_found else None
    emit_phase_progress('discovery', 'complete', details)

def start_crew_analysis():
    emit_phase_progress('crew_analysis', 'active')

def complete_crew_analysis():
    emit_phase_progress('crew_analysis', 'complete')

def start_report_generation():
    emit_phase_progress('report_generation', 'active')

def complete_report_generation():
    emit_phase_progress('report_generation', 'complete')

# Agent convenience functions
def start_agent(agent_name):
    emit_agent_progress(agent_name, 'active')

def complete_agent(agent_name):
    emit_agent_progress(agent_name, 'complete') 