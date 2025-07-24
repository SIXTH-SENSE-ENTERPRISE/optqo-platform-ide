import os
import json
import asyncio
import traceback
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import time
from agent3_report import EnhancedReportGenerationAgent

# Import progress emitter for web interface updates
try:
    from progress_emitter import (
        complete_discovery, start_crew_analysis, complete_crew_analysis, 
        start_report_generation, complete_report_generation,
        start_agent, complete_agent
    )
except ImportError:
    # Fallback functions if progress_emitter is not available
    def complete_discovery(files_found=None): pass
    def start_crew_analysis(): pass
    def complete_crew_analysis(): pass
    def start_report_generation(): pass
    def complete_report_generation(): pass
    def start_agent(agent_name): pass
    def complete_agent(agent_name): pass
# Import required classes
from chunking_service import ChunkingService
from aggregation_agent import AggregationAgent
from specialist_agents import (
    TechnologyDetectionAgent,
    CodeQualityAgent, 
    ArchitectureDataFlowAgent,
    FileStructureAgent,
    BusinessContextAgent,
    PerformanceAnalysisAgent
)

class EnhancedCrewOrchestrator:
    def __init__(self, log_dir="log"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        # Setup orchestrator logging
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = self.log_dir / f"orchestrator_{timestamp}.json"
        
        self.orchestration_log = {
            "timestamp": timestamp,
            "orchestrator": "enhanced_crew_system",
            "execution_steps": [],
            "agent_results": {},
            "final_result": None
        }
        
        print(f"🎭 Enhanced Crew Orchestrator logging to: {self.log_file}")
        
        # Error tracking
        self.error_log_file = self.log_dir / f"errors_{timestamp}.json"
        self.errors = []
        
        # Initialize all components
        self.chunking_service = ChunkingService(log_dir)
        self.aggregation_agent = AggregationAgent(log_dir)
        
        # Initialize specialist agents
        self.specialist_agents = {
            'technology_detection': TechnologyDetectionAgent(log_dir),
            'code_quality': CodeQualityAgent(log_dir),
            'architecture_dataflow': ArchitectureDataFlowAgent(log_dir),
            'file_structure': FileStructureAgent(log_dir),
            'business_context': BusinessContextAgent(log_dir),
            'performance_analysis': PerformanceAnalysisAgent(log_dir)
        }
        
        print(f"✅ Initialized {len(self.specialist_agents)} specialist agents")
    
    def _log_step(self, step_name, description, data=None):
        """Log orchestration steps"""
        step_info = {
            "step": step_name,
            "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "description": description
        }
        if data:
            step_info["data"] = data
        
        self.orchestration_log["execution_steps"].append(step_info)
        print(f"🎭 ORCHESTRATOR: {description}")
    
    def _log_error(self, agent_name, error_details, attempt=None):
        """Log errors with detailed information"""
        error_info = {
            "agent": agent_name,
            "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "error": str(error_details),
            "traceback": traceback.format_exc(),
            "attempt": attempt
        }
        
        self.errors.append(error_info)
        print(f"❌ ERROR [{agent_name}]: {error_details}")
        
        # Save error log immediately
        try:
            with open(self.error_log_file, 'w', encoding='utf-8') as f:
                json.dump(self.errors, f, indent=2, default=str)
        except Exception as e:
            print(f"⚠️ Failed to save error log: {e}")
    
    def analyze_repository(self, agent1_output):
        """Main orchestration method - analyze repository using enhanced crew system"""
        
        try:
            self._log_step("INIT", "Starting enhanced crew analysis")
            
            # Step 1: Create chunks for specialist analysis
            self._log_step("CHUNKING", "Creating content chunks for specialist agents")
            specialist_input = self.chunking_service.create_analysis_chunks(agent1_output)
            
            # Step 2: Execute specialist agents in parallel
            self._log_step("SPECIALIST_ANALYSIS", "Executing 6 specialist agents in parallel")
            specialist_outputs = self._execute_specialist_agents_parallel(specialist_input)
            
            # Step 3: Synthesize findings
            self._log_step("SYNTHESIS", "Synthesizing specialist findings")
            synthesized_analysis = self.aggregation_agent.synthesize_analysis(
                specialist_outputs, 
                specialist_input['project_context']
            )
            
            # Step 4: Prepare final result
            final_result = {
                'agent1_output': agent1_output,
                'agent2_output': synthesized_analysis,  # This goes to Agent 3
                'specialist_outputs': specialist_outputs,
                'analysis_metadata': {
                    'total_agents_executed': len(self.specialist_agents),
                    'successful_agents': len([o for o in specialist_outputs.values() if 'error' not in o]),
                    'failed_agents': len([o for o in specialist_outputs.values() if 'error' in o]),
                    'analysis_timestamp': datetime.now().isoformat(),
                    'orchestrator_version': 'enhanced_crew_v1.0'
                }
            }
            
            # Save final result
            self.orchestration_log["final_result"] = final_result
            self.orchestration_log["agent_results"] = specialist_outputs
            self._log_step("COMPLETE", "Enhanced crew analysis completed successfully")
            self._save_logs()
            
            return final_result
            
        except Exception as e:
            self._log_error("orchestrator", e)
            self._log_step("FATAL_ERROR", f"Orchestration failed: {str(e)}")
            self._save_logs()
            raise
    
    def _execute_specialist_agents_parallel(self, specialist_input):
        """Execute all specialist agents in parallel with error handling"""
        
        specialist_outputs = {}
        
        # Use ThreadPoolExecutor for true parallel execution
        with ThreadPoolExecutor(max_workers=6, thread_name_prefix="SpecialistAgent") as executor:
            
            # Submit all agent tasks
            future_to_agent = {}
            for agent_name, agent in self.specialist_agents.items():
                future = executor.submit(self._execute_single_agent, agent_name, agent, specialist_input)
                future_to_agent[future] = agent_name
                self._log_step("AGENT_SUBMIT", f"Submitted {agent_name} for parallel execution")
            
            # Collect results as they complete
            for future in as_completed(future_to_agent, timeout=300):  # 5 minute timeout
                agent_name = future_to_agent[future]
                
                try:
                    result = future.result()
                    specialist_outputs[agent_name] = result
                    self._log_step("AGENT_SUCCESS", f"✅ {agent_name} completed successfully")
                    
                    # Emit progress for agent completion
                    complete_agent(agent_name)
                    
                except Exception as e:
                    self._log_error(agent_name, e)
                    specialist_outputs[agent_name] = {
                        "error": "Agent execution failed after all retries",
                        "error_message": str(e),
                        "agent_name": agent_name
                    }
                    self._log_step("AGENT_FAILURE", f"❌ {agent_name} failed after all retries")
        
        # Log final agent execution summary
        successful_count = len([o for o in specialist_outputs.values() if 'error' not in o])
        failed_count = len([o for o in specialist_outputs.values() if 'error' in o])
        
        self._log_step("AGENTS_SUMMARY", 
                      f"Parallel execution complete: {successful_count} successful, {failed_count} failed")
        
        if failed_count > 0:
            failed_agents = [name for name, output in specialist_outputs.items() if 'error' in output]
            print(f"⚠️ WARNING: The following agents failed: {failed_agents}")
            print(f"📄 Error details saved to: {self.error_log_file}")
        
        return specialist_outputs
    
    def _execute_single_agent(self, agent_name, agent, specialist_input):
        """Execute a single specialist agent with retry logic"""
        
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                self._log_step("AGENT_ATTEMPT", f"{agent_name} attempt {attempt + 1}")
                
                # Emit progress for agent start (only on first attempt)
                if attempt == 0:
                    start_agent(agent_name)
                
                # Execute agent analysis
                result = agent.analyze(specialist_input)
                
                # Validate result
                if isinstance(result, dict) and 'error' not in result:
                    return result
                else:
                    raise Exception(f"Agent returned invalid result: {result}")
                    
            except Exception as e:
                self._log_error(agent_name, e, attempt + 1)
                
                if attempt < max_retries - 1:
                    self._log_step("AGENT_RETRY", f"{agent_name} retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 1.5  # Exponential backoff
                else:
                    # Final failure
                    raise Exception(f"Agent {agent_name} failed after {max_retries} attempts: {str(e)}")
        
        # Should not reach here
        raise Exception(f"Agent {agent_name} failed unexpectedly")
    
    def _save_logs(self):
        """Save all orchestration logs"""
        try:
            # Save main orchestration log
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump(self.orchestration_log, f, indent=2, default=str)
            
            # Save error log if there are errors
            if self.errors:
                with open(self.error_log_file, 'w', encoding='utf-8') as f:
                    json.dump(self.errors, f, indent=2, default=str)
            
            print(f"💾 Orchestration logs saved to: {self.log_file}")
            if self.errors:
                print(f"💾 Error logs saved to: {self.error_log_file}")
                
        except Exception as e:
            print(f"⚠️ Failed to save orchestration logs: {e}")


# Enhanced main execution function
def run_enhanced_analysis(repository_path, log_dir="log"):
    """Run the complete enhanced crew analysis on a repository"""
    
    print("🚀 STARTING ENHANCED CREW ANALYSIS")
    print("=" * 60)
    
    try:
        # Step 1: Discovery (using existing Agent 1)
        print("📁 Phase 1: Repository Discovery & Chunking")
        from agent1_discovery import ProjectDiscoveryAgent  # Import existing Agent 1
        
        discovery_agent = ProjectDiscoveryAgent()
        agent1_output = discovery_agent.analyze_directory(repository_path)
        
        print(f"✅ Discovery complete: {agent1_output['project_overview']['total_files']} files found")
        complete_discovery(agent1_output['project_overview']['total_files'])
        
        # Step 2: Enhanced Crew Analysis
        print("\n🎭 Phase 2: Enhanced Specialist Crew Analysis")
        start_crew_analysis()
        orchestrator = EnhancedCrewOrchestrator(log_dir)
        crew_analysis = orchestrator.analyze_repository(agent1_output)
        
        print(f"✅ Crew analysis complete")
        complete_crew_analysis()
        
        # Step 3: Report Generation (using existing Agent 3)
        print("\n📊 Phase 3: Professional Report Generation")# Import existing Agent 3
        start_report_generation()
        
        report_agent = EnhancedReportGenerationAgent()
        report_result = report_agent.generate_report(
            crew_analysis['agent1_output'],
            crew_analysis['agent2_output']
        )
        
        print(f"✅ Report generated: {report_result['report_path']}")
        complete_report_generation()
        
        # Final summary
        print("\n🎉 ENHANCED CREW ANALYSIS COMPLETE")
        print("=" * 60)
        print(f"📁 Project: {agent1_output['project_overview']['name']}")
        print(f"📊 Report: {report_result['report_path']}")
        
        analysis_metadata = crew_analysis['analysis_metadata']
        print(f"🤖 Agents: {analysis_metadata['successful_agents']}/{analysis_metadata['total_agents_executed']} successful")
        
        if analysis_metadata['failed_agents'] > 0:
            print(f"⚠️ Warning: {analysis_metadata['failed_agents']} agents failed - check error logs")
        
        return {
            'status': 'SUCCESS',
            'discovery_output': agent1_output,
            'crew_analysis': crew_analysis,
            'report_result': report_result,
            'metadata': analysis_metadata
        }
        
    except Exception as e:
        print(f"\n❌ ENHANCED CREW ANALYSIS FAILED")
        print(f"Error: {str(e)}")
        print("Check logs for detailed error information")
        
        return {
            'status': 'FAILED',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


# Test and example usage
if __name__ == "__main__":
    # Example usage
    test_repository = "/home/rishav/Documents/Code/6th-sense/Optqo_repo_function/repository"
    
    print("🧪 TESTING ENHANCED CREW SYSTEM")
    print("=" * 50)
    
    result = run_enhanced_analysis(test_repository)
    
    if result['status'] == 'SUCCESS':
        print("\n✅ Test completed successfully!")
        print(f"Report available at: {result['report_result']['report_path']}")
    else:
        print(f"\n❌ Test failed: {result['error']}")