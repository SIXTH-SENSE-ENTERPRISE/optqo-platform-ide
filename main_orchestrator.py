#!/usr/bin/env python3
"""
OptQo Repository Analysis System
Main Orchestrator - Coordinates all three agents to produce professional analysis reports
"""

import sys
import json
from pathlib import Path
from datetime import datetime
import traceback

# Import all agents (these should be in separate files or in the same directory)
from agent1_discovery import ProjectDiscoveryAgent
from agent2_analysis import CodeAnalysisAgent  
from agent3_report import ReportGenerationAgent

class RepositoryAnalysisSystem:
    def __init__(self, log_dir="log"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        # Initialize all agents
        self.discovery_agent = ProjectDiscoveryAgent(log_dir)
        self.analysis_agent = CodeAnalysisAgent(log_dir)
        self.report_agent = ReportGenerationAgent(log_dir)
        
        # System logging
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.system_log_file = self.log_dir / f"system_orchestrator_{timestamp}.json"
        
        self.system_log = {
            "timestamp": timestamp,
            "system": "repository_analysis_orchestrator",
            "execution_steps": [],
            "final_result": None
        }
        
        print(f"🚀 OptQo Analysis System initialized")
        print(f"📝 System logging to: {self.system_log_file}")
    
    def _log_system_step(self, step_name, description, duration=None, data=None):
        """Log system orchestration steps"""
        step_info = {
            "step": step_name,
            "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "description": description
        }
        if duration:
            step_info["duration_seconds"] = duration
        if data:
            step_info["data"] = data
        
        self.system_log["execution_steps"].append(step_info)
        
        duration_str = f" ({duration:.1f}s)" if duration else ""
        print(f"🔄 SYSTEM: {description}{duration_str}")
    
    def _save_system_log(self):
        """Save system orchestration log"""
        try:
            with open(self.system_log_file, 'w', encoding='utf-8') as f:
                json.dump(self.system_log, f, indent=2, default=str)
            print(f"💾 System log saved to: {self.system_log_file}")
        except Exception as e:
            print(f"⚠️ Failed to save system log: {e}")
    
    def analyze_repository(self, repository_path):
        """Main function to analyze a repository and generate professional report"""
        
        start_time = datetime.now()
        
        try:
            repository_path = Path(repository_path)
            
            if not repository_path.exists():
                raise FileNotFoundError(f"Repository path does not exist: {repository_path}")
            
            self._log_system_step("INIT", f"Starting analysis of repository: {repository_path}")
            
            # STAGE 1: Project Discovery
            print("\n" + "="*60)
            print("🔍 STAGE 1: PROJECT DISCOVERY")
            print("="*60)
            
            stage1_start = datetime.now()
            
            try:
                agent1_result = self.discovery_agent.analyze_directory(repository_path)
                stage1_duration = (datetime.now() - stage1_start).total_seconds()
                
                self._log_system_step(
                    "STAGE1_COMPLETE", 
                    f"Project discovery complete - {agent1_result['project_overview']['total_files']} files analyzed",
                    stage1_duration,
                    {"files_found": agent1_result['project_overview']['total_files']}
                )
                
            except Exception as e:
                self._log_system_step("STAGE1_ERROR", f"Project discovery failed: {str(e)}")
                raise Exception(f"Stage 1 (Discovery) failed: {e}")
            
            # STAGE 2: Code Analysis
            print("\n" + "="*60)
            print("🔬 STAGE 2: COMPREHENSIVE CODE ANALYSIS")
            print("="*60)
            
            stage2_start = datetime.now()
            
            try:
                agent2_result = self.analysis_agent.analyze_codebase(agent1_result)
                stage2_duration = (datetime.now() - stage2_start).total_seconds()
                
                quality_score = agent2_result.get('quality_assessment', {}).get('overall_quality_score', 'N/A')
                
                self._log_system_step(
                    "STAGE2_COMPLETE",
                    f"Code analysis complete - Quality Score: {quality_score}%",
                    stage2_duration,
                    {"quality_score": quality_score}
                )
                
            except Exception as e:
                self._log_system_step("STAGE2_ERROR", f"Code analysis failed: {str(e)}")
                raise Exception(f"Stage 2 (Analysis) failed: {e}")
            
            # STAGE 3: Report Generation
            print("\n" + "="*60)
            print("📊 STAGE 3: PROFESSIONAL REPORT GENERATION")
            print("="*60)
            
            stage3_start = datetime.now()
            
            try:
                agent3_result = self.report_agent.generate_report(agent1_result, agent2_result)
                stage3_duration = (datetime.now() - stage3_start).total_seconds()
                
                self._log_system_step(
                    "STAGE3_COMPLETE",
                    f"Professional report generated: {agent3_result['report_path']}",
                    stage3_duration,
                    {"report_path": agent3_result['report_path']}
                )
                
            except Exception as e:
                self._log_system_step("STAGE3_ERROR", f"Report generation failed: {str(e)}")
                raise Exception(f"Stage 3 (Report Generation) failed: {e}")
            
            # FINAL SUMMARY
            total_duration = (datetime.now() - start_time).total_seconds()
            
            final_result = {
                "repository_path": str(repository_path),
                "project_name": agent1_result['project_overview']['name'],
                "analysis_summary": {
                    "total_files": agent1_result['project_overview']['total_files'],
                    "primary_technology": agent1_result['technology_stack']['primary_technology'],
                    "quality_score": agent2_result.get('quality_assessment', {}).get('overall_quality_score', 'N/A'),
                    "chunking_used": agent1_result['chunking_decision']['needs_chunking']
                },
                "output_files": {
                    "html_report": agent3_result['report_path'],
                    "discovery_log": str(self.discovery_agent.log_file),
                    "analysis_log": str(self.analysis_agent.log_file),
                    "report_log": str(self.report_agent.log_file),
                    "system_log": str(self.system_log_file)
                },
                "execution_time": {
                    "total_seconds": total_duration,
                    "stage1_seconds": stage1_duration,
                    "stage2_seconds": stage2_duration,
                    "stage3_seconds": stage3_duration
                },
                "success": True
            }
            
            self.system_log["final_result"] = final_result
            self._log_system_step("SUCCESS", f"Complete analysis finished in {total_duration:.1f}s", total_duration)
            
            # Print final summary
            self._print_final_summary(final_result)
            
            # Save system log
            self._save_system_log()
            
            return final_result
            
        except Exception as e:
            total_duration = (datetime.now() - start_time).total_seconds()
            
            error_result = {
                "repository_path": str(repository_path),
                "error": str(e),
                "traceback": traceback.format_exc(),
                "execution_time": total_duration,
                "success": False
            }
            
            self.system_log["error"] = error_result
            self._log_system_step("SYSTEM_ERROR", f"Analysis failed after {total_duration:.1f}s: {str(e)}")
            self._save_system_log()
            
            print(f"\n❌ ANALYSIS FAILED: {e}")
            raise
    
    def _print_final_summary(self, result):
        """Print a beautiful final summary"""
        print("\n" + "="*60)
        print("✅ ANALYSIS COMPLETE - SUMMARY")
        print("="*60)
        
        print(f"📁 Project: {result['project_name']}")
        print(f"🔧 Technology: {result['analysis_summary']['primary_technology']}")
        print(f"📄 Files Analyzed: {result['analysis_summary']['total_files']}")
        print(f"📊 Quality Score: {result['analysis_summary']['quality_score']}%")
        print(f"⚡ Total Time: {result['execution_time']['total_seconds']:.1f} seconds")
        
        print(f"\n📋 OUTPUT FILES:")
        print(f"  • HTML Report: {result['output_files']['html_report']}")
        print(f"  • System Logs: {result['output_files']['system_log']}")
        
        print(f"\n🕐 EXECUTION BREAKDOWN:")
        print(f"  • Discovery: {result['execution_time']['stage1_seconds']:.1f}s")
        print(f"  • Analysis: {result['execution_time']['stage2_seconds']:.1f}s") 
        print(f"  • Report: {result['execution_time']['stage3_seconds']:.1f}s")
        
        print("\n🎉 Professional analysis report generated successfully!")
        print("="*60)

def main():
    """Main function for command-line usage"""
    
    if len(sys.argv) != 2:
        print("Usage: python main_orchestrator.py <repository_path>")
        print("Example: python main_orchestrator.py /path/to/your/repository")
        sys.exit(1)
    
    repository_path = sys.argv[1]
    
    try:
        # Initialize and run the analysis system
        analysis_system = RepositoryAnalysisSystem()
        result = analysis_system.analyze_repository(repository_path)
        
        # Exit successfully
        sys.exit(0)
        
    except KeyboardInterrupt:
        print("\n⚠️ Analysis interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)

def test_with_sample_repository():
    """Test function for development"""
    
    # Use your BSE project path
    test_repository = "/home/rishav/Documents/Code/6th-sense/Optqo_repo_function/repository"
    
    try:
        analysis_system = RepositoryAnalysisSystem()
        result = analysis_system.analyze_repository(test_repository)
        
        print(f"\n🧪 TEST COMPLETE")
        print(f"Report available at: {result['output_files']['html_report']}")
        
        return result
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return None

if __name__ == "__main__":
    # Uncomment one of these based on what you want to do:
    
    # For command line usage:
    main()
    
    # For testing with your BSE repository:
    # test_with_sample_repository()