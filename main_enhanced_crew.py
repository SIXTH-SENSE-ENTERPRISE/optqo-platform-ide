#!/usr/bin/env python3
"""
Enhanced Crew Analysis System - Main Entry Point

A comprehensive multi-agent system for repository analysis featuring:
- 6 specialized analysis agents with AWS Bedrock Claude integration
- Parallel execution with retry logic and error handling
- Professional optqo-branded HTML report generation
- Comprehensive logging and error tracking

Usage:
    python main_enhanced_crew.py /path/to/repository

Author: optqo Platform
Version: 1.0
"""

import sys
import os
import argparse
from pathlib import Path
from datetime import datetime

# Add current directory to path for imports
sys.path.append(str(Path(__file__).parent))

# Import progress emitter for web interface updates
try:
    from progress_emitter import start_discovery, complete_discovery, start_crew_analysis, complete_crew_analysis, start_report_generation, complete_report_generation
except ImportError:
    # Fallback functions if progress_emitter is not available
    def start_discovery(): pass
    def complete_discovery(files_found=None): pass
    def start_crew_analysis(): pass
    def complete_crew_analysis(): pass
    def start_report_generation(): pass
    def complete_report_generation(): pass

# Import all components
try:
    # Existing components
    from agent1_discovery import ProjectDiscoveryAgent
    from agent3_report import EnhancedReportGenerationAgent
    
    # New enhanced crew components (these would be in separate files)
    from chunking_service import ChunkingService
    from specialist_agents import (
        BaseSpecialistAgent,
        TechnologyDetectionAgent,
        CodeQualityAgent,
        ArchitectureDataFlowAgent,
        FileStructureAgent,
        BusinessContextAgent,
        PerformanceAnalysisAgent
    )
    from aggregation_agent import AggregationAgent
    from orchrstration_system import EnhancedCrewOrchestrator, run_enhanced_analysis
    
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("Please ensure all required components are available:")
    print("- agent1_discovery.py")
    print("- agent3_report.py") 
    print("- Enhanced crew system files")
    sys.exit(1)


def setup_logging_directory():
    """Ensure logging directory exists"""
    # Check for environment variables from web interface
    log_dir_env = os.getenv('OPTQO_LOG_DIR')
    reports_dir_env = os.getenv('OPTQO_REPORTS_DIR')
    
    if log_dir_env:
        log_dir = Path(log_dir_env)
    else:
        log_dir = Path("log")
    
    if reports_dir_env:
        reports_dir = Path(reports_dir_env)
    else:
        reports_dir = Path("reports")
    
    log_dir.mkdir(exist_ok=True)
    reports_dir.mkdir(exist_ok=True)
    
    return log_dir, reports_dir


def validate_repository_path(repo_path):
    """Validate that the repository path exists and contains files"""
    
    repo_path = Path(repo_path)
    
    if not repo_path.exists():
        raise ValueError(f"Repository path does not exist: {repo_path}")
    
    if not repo_path.is_dir():
        raise ValueError(f"Repository path is not a directory: {repo_path}")
    
    # Check for at least some files
    files = list(repo_path.rglob("*"))
    if len(files) == 0:
        raise ValueError(f"Repository directory is empty: {repo_path}")
    
    print(f"✅ Repository validated: {repo_path}")
    print(f"   Total items found: {len(files)}")
    
    return repo_path


def print_system_info():
    """Print system information and component status"""
    
    print("🎭 ENHANCED CREW ANALYSIS SYSTEM")
    print("=" * 60)
    print("optqo Platform - Intelligent Assessment with Advanced AI")
    print(f"Analysis started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    print("🤖 SPECIALIST AGENTS:")
    agents = [
        "Technology Detection Agent",
        "Code Quality Agent", 
        "Architecture & Data Flow Agent",
        "File Structure Agent",
        "Business Context Agent",
        "Performance Analysis Agent"
    ]
    
    for i, agent in enumerate(agents, 1):
        print(f"   {i}. {agent}")
    
    print()
    print("⚡ SYSTEM FEATURES:")
    features = [
        "Parallel agent execution with retry logic",
        "AWS Bedrock Claude integration",
        "Comprehensive error handling and logging",
        "Professional optqo-branded HTML reports",
        "Strategic business recommendations",
        "Executive-ready analysis synthesis"
    ]
    
    for feature in features:
        print(f"   ✓ {feature}")
    
    print()


def main():
    """Main entry point for the enhanced crew analysis system"""
    
    # Setup argument parsing
    parser = argparse.ArgumentParser(
        description="Enhanced Crew Analysis System for Repository Assessment",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python main_enhanced_crew.py /path/to/repository
    python main_enhanced_crew.py ~/projects/my-app
    python main_enhanced_crew.py ./repository --verbose
        """)
    
    parser.add_argument(
        "repository_path",
        help="Path to the repository/codebase to analyze"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging output"
    )
    
    parser.add_argument(
        "--output-dir", "-o",
        default="reports",
        help="Directory for output reports (default: reports/)"
    )
    
    args = parser.parse_args()
    
    try:
        # Print system information
        print_system_info()
        
        # Setup logging directories
        log_dir, reports_dir = setup_logging_directory()
        print(f"📁 Logs will be saved to: {log_dir}")
        print(f"📊 Reports will be saved to: {reports_dir}")
        print()
        
        # Validate repository path
        repo_path = validate_repository_path(args.repository_path)
        
        # Run the enhanced crew analysis
        print("🚀 STARTING ANALYSIS...")
        print("-" * 40)
        
        # Emit overall analysis start
        start_discovery()
        
        result = run_enhanced_analysis(str(repo_path), str(log_dir))
        
        # Process results
        if result['status'] == 'SUCCESS':
            print()
            print("🎉 ANALYSIS COMPLETED SUCCESSFULLY!")
            print("=" * 60)
            
            # Print summary
            discovery = result['discovery_output']
            metadata = result['metadata']
            report = result['report_result']
            
            print(f"📁 Project: {discovery['project_overview']['name']}")
            print(f"🔧 Technology: {discovery['technology_stack']['primary_technology']}")
            print(f"📄 Files Analyzed: {discovery['project_overview']['total_files']}")
            print(f"🤖 Agents: {metadata['successful_agents']}/{metadata['total_agents_executed']} successful")
            print()
            print(f"📊 Report Generated: {report['report_path']}")
            print(f"🕒 Analysis Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            if metadata['failed_agents'] > 0:
                print()
                print(f"⚠️  WARNING: {metadata['failed_agents']} agents failed")
                print("   Check error logs for details")
            
            print()
            print("🌐 Open the HTML report in your browser to view the complete analysis!")
            
            return 0
            
        else:
            print()
            print("❌ ANALYSIS FAILED")
            print("=" * 40)
            print(f"Error: {result['error']}")
            print()
            print("💡 Troubleshooting:")
            print("   1. Check repository path is correct")
            print("   2. Ensure AWS credentials are configured")
            print("   3. Check error logs in the log/ directory")
            print("   4. Verify network connectivity to AWS Bedrock")
            
            return 1
            
    except KeyboardInterrupt:
        print("\n🛑 Analysis interrupted by user")
        return 130
        
    except Exception as e:
        print(f"\n❌ SYSTEM ERROR: {str(e)}")
        print("\nFor support, please check:")
        print("   - System requirements and dependencies")
        print("   - AWS Bedrock access and credentials")
        print("   - Log files for detailed error information")
        
        if args.verbose:
            import traceback
            print("\nDetailed error trace:")
            traceback.print_exc()
        
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)