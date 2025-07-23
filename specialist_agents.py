import boto3
import json
import time
from pathlib import Path
from datetime import datetime

##---------------------------------------------------
    
class BaseSpecialistAgent:
    def __init__(self, agent_name, log_dir="log"):
        # AWS Bedrock setup
        self.client = boto3.client('bedrock-runtime', region_name='us-east-1')
        self.model_id = "arn:aws:bedrock:us-east-1:216989122843:inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0"
        
        # Logging setup
        self.agent_name = agent_name
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = self.log_dir / f"{agent_name}_{timestamp}.json"
        
        self.analysis_log = {
            "timestamp": timestamp,
            "agent": agent_name,
            "analysis_steps": [],
            "final_result": None
        }
        
        print(f"📝 {agent_name} logging to: {self.log_file}")
        
        # Retry configuration
        self.max_retries = 3
        self.retry_delay = 2  # seconds
    
    def _log_step(self, step_name, description, data=None):
        """Log analysis steps"""
        step_info = {
            "step": step_name,
            "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "description": description
        }
        if data:
            step_info["data"] = data
        
        self.analysis_log["analysis_steps"].append(step_info)
        print(f"🔄 {self.agent_name}: {description}")
    
    def _execute_llm_analysis(self, prompt):
        """Execute LLM analysis with retry logic"""
        
        for attempt in range(self.max_retries):
            try:
                self._log_step("LLM_CALL", f"Executing LLM analysis (attempt {attempt + 1})")
                
                request_body = {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 4000,
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                }
                
                response = self.client.invoke_model(
                    modelId=self.model_id,
                    body=json.dumps(request_body),
                    contentType="application/json"
                )
                
                response_body = json.loads(response['body'].read())
                response_content = response_body['content'][0]['text']
                
                # Parse JSON response
                try:
                    analysis_result = json.loads(response_content)
                    self._log_step("LLM_SUCCESS", "LLM analysis completed successfully")
                    return analysis_result
                    
                except json.JSONDecodeError as e:
                    if attempt < self.max_retries - 1:
                        self._log_step("JSON_PARSE_ERROR", f"JSON parsing failed, retrying... Error: {e}")
                        time.sleep(self.retry_delay)
                        continue
                    else:
                        self._log_step("JSON_PARSE_FAILURE", f"Final JSON parsing failure: {e}")
                        return {
                            "error": "Failed to parse LLM response",
                            "raw_response": response_content[:1000],
                            "agent": self.agent_name,
                            "attempt": attempt + 1
                        }
                        
            except Exception as e:
                if attempt < self.max_retries - 1:
                    self._log_step("LLM_ERROR", f"LLM call failed, retrying... Error: {e}")
                    time.sleep(self.retry_delay)
                    continue
                else:
                    self._log_step("LLM_FAILURE", f"Final LLM failure: {e}")
                    return {
                        "error": "LLM analysis failed",
                        "error_message": str(e),
                        "agent": self.agent_name,
                        "attempt": attempt + 1
                    }
        
        # Should not reach here, but just in case
        return {
            "error": "Analysis failed after all retries",
            "agent": self.agent_name,
            "max_retries": self.max_retries
        }
    
    def _save_log(self):
        """Save analysis log"""
        try:
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump(self.analysis_log, f, indent=2, default=str)
        except Exception as e:
            print(f"⚠️ Failed to save {self.agent_name} log: {e}")
    
    def analyze(self, specialist_input):
        """Main analysis method - to be implemented by subclasses"""
        raise NotImplementedError("Subclasses must implement analyze method")

##-------------------------------------------------------

class TechnologyDetectionAgent(BaseSpecialistAgent):
    def __init__(self, log_dir="log"):
        super().__init__("technology_detection_agent", log_dir)
    
    def analyze(self, specialist_input):
        """Analyze technology stack across all chunks"""
        
        try:
            self._log_step("INIT", "Starting technology stack analysis")
            
            project_context = specialist_input['project_context']
            chunks = specialist_input['chunks']
            
            # Prepare analysis prompt
            prompt = self._create_analysis_prompt(project_context, chunks)
            
            # Execute analysis
            result = self._execute_llm_analysis(prompt)
            
            # Save result and log
            self.analysis_log["final_result"] = result
            self._log_step("COMPLETE", "Technology analysis complete")
            self._save_log()
            
            return result
            
        except Exception as e:
            self._log_step("ERROR", f"Technology analysis failed: {str(e)}")
            self.analysis_log["error"] = str(e)
            self._save_log()
            raise
    
    def _create_analysis_prompt(self, project_context, chunks):
        """Create technology analysis prompt"""
        
        # Format chunks for analysis
        chunks_content = ""
        for chunk in chunks:
            chunks_content += f"\n{'='*60}\nCHUNK: {chunk['chunk_id']} ({chunk['file_count']} files)\n{'='*60}\n"
            chunks_content += chunk['content'][:15000]  # Limit chunk size for context management
            if len(chunk['content']) > 15000:
                chunks_content += f"\n... [CONTENT TRUNCATED - Total: {chunk['content_chars']} chars]\n"
        
        prompt = f"""You are a Senior Technology Stack Specialist with deep expertise in analytical platforms, enterprise systems, and software architecture.

PROJECT OVERVIEW:
- Project Name: {project_context['name']}
- Total Files: {project_context['total_files']}
- Primary Technology (Initial): {project_context['primary_technology']}
- All Technologies (Initial): {project_context['all_technologies']}
- Project Type: {project_context['project_type']}

COMPLETE CODEBASE CONTENT:
{chunks_content}

ANALYSIS FOCUS:
Identify and assess the complete technology ecosystem of this codebase.

SPECIALIZED EXPERTISE:
- Analytics Platforms: SAS, R, Python, MATLAB, SPSS, STATA, Julia
- Enterprise Languages: Java, C#, Go, Scala, SQL
- Web Technologies: JavaScript, HTML, CSS, PHP, React, Angular
- Data Technologies: SQL variants, NoSQL, ETL tools
- Infrastructure: Docker, Kubernetes, cloud platforms
- Configuration: JSON, YAML, XML, environment files

ANALYSIS TASKS:
1. Identify primary and secondary technologies by analyzing code patterns, not just extensions
2. Assess technology integration quality and coherence
3. Detect frameworks, libraries, and dependencies from imports/includes
4. Evaluate technology choices appropriateness for the project type
5. Identify deprecated or legacy technology usage

OUTPUT (JSON only, no markdown, no explanations):
{{
  "primary_technology": "PYTHON|SAS|JAVA|etc",
  "secondary_technologies": ["SQL", "JavaScript", "Shell"],
  "technology_assessment": {{
    "stack_coherence": 85,
    "integration_quality": 78,
    "modernity_score": 70
  }},
  "detected_frameworks": [
    {{"name": "pandas", "purpose": "data manipulation", "files": ["analysis.py"]}},
    {{"name": "express", "purpose": "web server", "files": ["server.js"]}}
  ],
  "platform_analysis": {{
    "primary_platform_usage": "Extensive statistical analysis with proper data handling",
    "technology_alignment": "Well-suited for analytical workload",
    "integration_patterns": ["Database connectivity", "File processing", "API integration"]
  }},
  "technology_recommendations": [
    {{"priority": "HIGH", "recommendation": "Upgrade deprecated libraries", "affected_tech": "Python 2.7"}},
    {{"priority": "MEDIUM", "recommendation": "Standardize SQL dialect usage", "affected_tech": "Mixed SQL"}}
  ],
  "legacy_concerns": ["Deprecated Python 2.7 usage", "Unsupported jQuery version"]
}}

ANALYSIS GUIDELINES:
- Focus on actual code usage, not just file presence
- Assess technology choices in context of project requirements
- Identify integration anti-patterns and inconsistencies
- Provide specific, actionable technology recommendations
- Note any unusual or innovative technology usage patterns"""

        return prompt

##------------------------------------------------------------

class CodeQualityAgent(BaseSpecialistAgent):
    def __init__(self, log_dir="log"):
        super().__init__("code_quality_agent", log_dir)
    
    def analyze(self, specialist_input):
        """Analyze code quality across all chunks"""
        
        try:
            self._log_step("INIT", "Starting code quality analysis")
            
            project_context = specialist_input['project_context']
            chunks = specialist_input['chunks']
            
            # Prepare analysis prompt
            prompt = self._create_analysis_prompt(project_context, chunks)
            
            # Execute analysis
            result = self._execute_llm_analysis(prompt)
            
            # Save result and log
            self.analysis_log["final_result"] = result
            self._log_step("COMPLETE", "Code quality analysis complete")
            self._save_log()
            
            return result
            
        except Exception as e:
            self._log_step("ERROR", f"Code quality analysis failed: {str(e)}")
            self.analysis_log["error"] = str(e)
            self._save_log()
            raise
    
    def _create_analysis_prompt(self, project_context, chunks):
        """Create code quality analysis prompt"""
        
        # Format chunks for analysis
        chunks_content = ""
        for chunk in chunks:
            chunks_content += f"\n{'='*60}\nCHUNK: {chunk['chunk_id']} ({chunk['file_count']} files)\n{'='*60}\n"
            chunks_content += chunk['content'][:15000]  # Limit chunk size
            if len(chunk['content']) > 15000:
                chunks_content += f"\n... [CONTENT TRUNCATED - Total: {chunk['content_chars']} chars]\n"
        
        prompt = f"""You are a Senior Code Quality Analyst specializing in comprehensive quality assessment across all programming platforms.

PROJECT OVERVIEW:
- Project Name: {project_context['name']}
- Primary Technology: {project_context['primary_technology']}
- Total Files: {project_context['total_files']}
- Project Type: {project_context['project_type']}

COMPLETE CODEBASE CONTENT:
{chunks_content}

ANALYSIS FOCUS:
Evaluate code quality across six core dimensions with evidence-based scoring.

QUALITY FRAMEWORK:
1. **Functionality** (0-100): Does the code work? Feature completeness, logic correctness
2. **Code Organization** (0-100): Structure, modularity, separation of concerns
3. **Documentation** (0-100): Comments, inline docs, code clarity
4. **Best Practices** (0-100): Platform-specific standards adherence
5. **Error Handling** (0-100): Exception management, input validation, robustness
6. **Performance** (0-100): Efficiency, optimization, resource usage

ANALYSIS TASKS:
1. Evaluate each dimension independently with specific evidence
2. Apply platform-specific quality standards (SAS vs Python vs Java standards differ)
3. Identify critical quality issues with business impact
4. Provide concrete examples and line-of-code references
5. Generate actionable improvement recommendations

OUTPUT (JSON only, no markdown, no explanations):
{{
  "quality_scores": {{
    "functionality": {{
      "score": 85,
      "reasoning": "Core business logic implemented correctly with proper data processing",
      "evidence": ["Successfully processes input data", "Handles edge cases", "Produces expected outputs"],
      "issues": ["Missing validation for null inputs", "Incomplete error scenarios"]
    }},
    "code_organization": {{
      "score": 65,
      "reasoning": "Moderate structure with some modularity issues",
      "evidence": ["Clear function separation", "Logical file grouping"],
      "issues": ["Mixed responsibilities in single functions", "Unclear module boundaries"]
    }},
    "documentation": {{
      "score": 40,
      "reasoning": "Limited documentation with missing business context",
      "evidence": ["Some inline comments present", "Function headers exist"],
      "issues": ["No business logic explanation", "Missing API documentation", "Unclear variable naming"]
    }},
    "best_practices": {{
      "score": 70,
      "reasoning": "Generally follows platform conventions with some deviations",
      "evidence": ["Proper SQL syntax", "Standard function naming"],
      "issues": ["Hard-coded configuration values", "Mixed coding styles"]
    }},
    "error_handling": {{
      "score": 45,
      "reasoning": "Basic error handling present but incomplete coverage",
      "evidence": ["Some try-catch blocks", "Basic input validation"],
      "issues": ["No comprehensive exception handling", "Missing edge case handling"]
    }},
    "performance": {{
      "score": 75,
      "reasoning": "Generally efficient with some optimization opportunities",
      "evidence": ["Efficient algorithms used", "Proper indexing"],
      "issues": ["Nested loops in data processing", "Unoptimized database queries"]
    }}
  }},
  "overall_quality_score": 63,
  "critical_issues": [
    {{
      "category": "error_handling",
      "issue": "Missing input validation for financial data processing",
      "impact": "HIGH",
      "files_affected": ["data_processor.py", "analysis.sql"],
      "business_risk": "Invalid data could lead to incorrect calculations"
    }}
  ],
  "quality_trends": {{
    "strongest_area": "performance",
    "weakest_area": "documentation",
    "improvement_priority": "error_handling"
  }},
  "improvement_opportunities": [
    {{
      "priority": "HIGH",
      "category": "error_handling",
      "action": "Implement comprehensive input validation and exception handling",
      "effort_estimate": "1-2 weeks",
      "quality_impact": "Improve error handling score from 45 to 75"
    }}
  ]
}}

SCORING GUIDELINES:
- 90-100: Excellent, industry best practices
- 75-89: Good, professional quality with minor issues
- 50-74: Average, functional but needs improvement
- 25-49: Below average, significant issues present
- 0-24: Poor, major problems requiring immediate attention

Focus on specific evidence from the actual code, not theoretical assessments."""

        return prompt

class ArchitectureDataFlowAgent(BaseSpecialistAgent):
    def __init__(self, log_dir="log"):
        super().__init__("architecture_dataflow_agent", log_dir)
    
    def analyze(self, specialist_input):
        """Analyze system architecture and data flow across all chunks"""
        
        try:
            self._log_step("INIT", "Starting architecture and data flow analysis")
            
            project_context = specialist_input['project_context']
            chunks = specialist_input['chunks']
            
            # Prepare analysis prompt
            prompt = self._create_analysis_prompt(project_context, chunks)
            
            # Execute analysis
            result = self._execute_llm_analysis(prompt)
            
            # Save result and log
            self.analysis_log["final_result"] = result
            self._log_step("COMPLETE", "Architecture analysis complete")
            self._save_log()
            
            return result
            
        except Exception as e:
            self._log_step("ERROR", f"Architecture analysis failed: {str(e)}")
            self.analysis_log["error"] = str(e)
            self._save_log()
            raise
    
    def _create_analysis_prompt(self, project_context, chunks):
        """Create architecture analysis prompt"""
        
        # Format chunks for analysis
        chunks_content = ""
        for chunk in chunks:
            chunks_content += f"\n{'='*60}\nCHUNK: {chunk['chunk_id']} ({chunk['file_count']} files)\n{'='*60}\n"
            chunks_content += chunk['content'][:15000]  # Limit chunk size
            if len(chunk['content']) > 15000:
                chunks_content += f"\n... [CONTENT TRUNCATED - Total: {chunk['content_chars']} chars]\n"
        
        prompt = f"""You are a Senior System Architect specializing in data processing systems and enterprise architecture patterns.

PROJECT OVERVIEW:
- Project Name: {project_context['name']}
- Primary Technology: {project_context['primary_technology']}
- Total Files: {project_context['total_files']}
- Project Type: {project_context['project_type']}

COMPLETE CODEBASE CONTENT:
{chunks_content}

ANALYSIS FOCUS:
Analyze system architecture, design patterns, and complete data flow from inputs to outputs.

ARCHITECTURAL EXPERTISE:
- Design Patterns: ETL, ELT, Microservices, Monolith, Pipeline, Batch, Real-time
- Data Flow Analysis: Source → Processing → Destination mapping
- Integration Patterns: APIs, Message Queues, File Exchange, Database Connectivity
- Scalability Assessment: Bottlenecks, parallel processing, resource utilization

ANALYSIS TASKS:
1. Map complete data processing pipeline across all files
2. Identify architectural patterns and anti-patterns
3. Analyze component relationships and dependencies
4. Assess system scalability and performance architecture
5. Evaluate integration points and external dependencies

OUTPUT (JSON only, no markdown, no explanations):
{{
  "system_architecture": {{
    "primary_pattern": "ETL_Pipeline",
    "secondary_patterns": ["Batch_Processing", "Parallel_Computing"],
    "architecture_score": 78
  }},
  "data_flow_analysis": {{
    "data_sources": [
      {{"source": "Database tables", "type": "SQL", "files": ["data_loader.sql"]}},
      {{"source": "CSV files", "type": "File", "files": ["file_processor.py"]}}
    ],
    "processing_stages": [
      {{"stage": "Data_Validation", "purpose": "Clean and validate inputs", "files": ["validator.py"]}},
      {{"stage": "Transformation", "purpose": "Apply business logic", "files": ["transformer.sql"]}},
      {{"stage": "Analysis", "purpose": "Generate insights", "files": ["analyzer.py"]}},
      {{"stage": "Output_Generation", "purpose": "Create reports", "files": ["reporter.py"]}}
    ],
    "data_outputs": [
      {{"output": "Reports", "format": "HTML/PDF", "files": ["report_gen.py"]}},
      {{"output": "Database updates", "format": "SQL", "files": ["updater.sql"]}}
    ]
  }},
  "system_components": [
    {{
      "component": "DataProcessor",
      "responsibility": "Core data transformation logic",
      "files": ["processor.py", "transform.sql"],
      "criticality": "HIGH",
      "dependencies": ["Database", "FileSystem"]
    }}
  ],
  "integration_points": [
    {{"system": "External Database", "method": "SQL Connection", "purpose": "Data source"}},
    {{"system": "File System", "method": "File I/O", "purpose": "Configuration and output"}},
    {{"system": "Web API", "method": "HTTP", "purpose": "External data feeds"}}
  ],
  "architectural_strengths": [
    "Clear separation of data processing stages",
    "Modular component design",
    "Parallel processing capability"
  ],
  "architectural_concerns": [
    "Single point of failure in data validator",
    "Tight coupling between components",
    "Limited error recovery mechanisms"
  ],
  "scalability_assessment": {{
    "current_capacity": "Medium - handles moderate data volumes efficiently",
    "bottlenecks": ["Database I/O operations", "Single-threaded processing"],
    "scaling_recommendations": [
      {{"aspect": "Database", "recommendation": "Implement connection pooling"}},
      {{"aspect": "Processing", "recommendation": "Add parallel processing for large datasets"}}
    ],
    "scalability_score": 65
  }},
  "design_quality": {{
    "modularity": 70,
    "maintainability": 65,
    "testability": 55,
    "deployability": 60
  }},
  "improvement_opportunities": [
    {{
      "priority": "HIGH",
      "category": "architecture",
      "action": "Implement microservices pattern for better scalability",
      "effort_estimate": "6-8 weeks",
      "architectural_impact": "Improves scalability and maintainability"
    }}
  ]
}}

ANALYSIS GUIDELINES:
- Focus on actual data flow, not theoretical patterns
- Identify real bottlenecks and scaling issues
- Assess architecture appropriateness for the problem domain
- Provide specific, implementable architectural improvements
- Consider both technical and business architectural requirements"""

        return prompt

##----------------------------------------------------------------------

class FileStructureAgent(BaseSpecialistAgent):
    def __init__(self, log_dir="log"):
        super().__init__("file_structure_agent", log_dir)
    
    def analyze(self, specialist_input):
        """Analyze project file structure and organization"""
        
        try:
            self._log_step("INIT", "Starting file structure and organization analysis")
            
            project_context = specialist_input['project_context']
            chunks = specialist_input['chunks']
            
            # Extract file structure information from chunks
            file_structure_data = self._extract_file_structure(chunks)
            
            # Prepare analysis prompt
            prompt = self._create_analysis_prompt(project_context, file_structure_data)
            
            # Execute analysis
            result = self._execute_llm_analysis(prompt)
            
            # Save result and log
            self.analysis_log["final_result"] = result
            self._log_step("COMPLETE", "File structure analysis complete")
            self._save_log()
            
            return result
            
        except Exception as e:
            self._log_step("ERROR", f"File structure analysis failed: {str(e)}")
            self.analysis_log["error"] = str(e)
            self._save_log()
            raise
    
    def _extract_file_structure(self, chunks):
        """Extract file organization information from chunks"""
        
        all_files = []
        directory_structure = {}
        
        for chunk in chunks:
            for file_info in chunk['files']:
                all_files.append({
                    'name': file_info['name'],
                    'path': file_info['path'],
                    'extension': file_info['extension'],
                    'size_chars': file_info['size_chars']
                })
                
                # Build directory structure
                path_parts = Path(file_info['path']).parts[:-1]  # Exclude filename
                current_level = directory_structure
                
                for part in path_parts:
                    if part not in current_level:
                        current_level[part] = {}
                    current_level = current_level[part]
        
        return {
            'all_files': all_files,
            'directory_structure': directory_structure,
            'total_files': len(all_files),
            'file_extensions': list(set(f['extension'] for f in all_files)),
            'directory_depth': max(len(Path(f['path']).parts) for f in all_files) if all_files else 0
        }
    
    def _create_analysis_prompt(self, project_context, file_structure_data):
        """Create file structure analysis prompt"""
        
        # Format file list for analysis
        files_summary = ""
        for file_info in file_structure_data['all_files'][:50]:  # Limit for prompt size
            files_summary += f"- {file_info['path']} ({file_info['extension']}, {file_info['size_chars']} chars)\n"
        
        if len(file_structure_data['all_files']) > 50:
            files_summary += f"... and {len(file_structure_data['all_files']) - 50} more files\n"
        
        # Format directory structure
        directory_summary = self._format_directory_structure(file_structure_data['directory_structure'])
        
        prompt = f"""You are a Senior DevOps Engineer specializing in project organization, build systems, and development workflow optimization.

PROJECT OVERVIEW:
- Project Name: {project_context['name']}
- Primary Technology: {project_context['primary_technology']}
- Total Files: {file_structure_data['total_files']}
- Directory Depth: {file_structure_data['directory_depth']}
- File Extensions: {file_structure_data['file_extensions']}

COMPLETE FILE STRUCTURE:
{files_summary}

DIRECTORY HIERARCHY:
{directory_summary}

ANALYSIS FOCUS:
Evaluate project organization, naming conventions, modularity, and development workflow structure.

EXPERTISE AREAS:
- Project Structure Standards: Language-specific conventions, industry best practices
- Naming Conventions: Files, directories, modules, configuration consistency
- Modularity Assessment: Code separation, reusability, dependency management
- Build and Deployment: Configuration management, environment separation
- Development Workflow: Version control patterns, testing structure

ANALYSIS TASKS:
1. Analyze directory hierarchy and organization logic
2. Evaluate naming consistency across files and folders
3. Assess modularity and code separation quality
4. Identify configuration and build management patterns
5. Generate structure optimization recommendations

OUTPUT (JSON only, no markdown, no explanations):
{{
  "structure_analysis": {{
    "organization_score": 68,
    "naming_consistency": 45,
    "modularity_rating": 72,
    "overall_structure_score": 62
  }},
  "directory_analysis": {{
    "structure_type": "Flat_With_Subdirectories",
    "depth_analysis": {{
      "max_depth": 3,
      "average_depth": 2,
      "depth_consistency": "Good"
    }},
    "directory_purposes": [
      {{"path": "src/", "purpose": "Source code", "quality": "Well_Organized"}},
      {{"path": "config/", "purpose": "Configuration files", "quality": "Mixed_Types"}},
      {{"path": "data/", "purpose": "Data files", "quality": "Needs_Organization"}}
    ]
  }},
  "naming_convention_analysis": {{
    "consistency_issues": [
      "Mixed case conventions (camelCase vs snake_case)",
      "Inconsistent file prefixes",
      "Non-descriptive generic names (file1.py, temp.sql)"
    ],
    "positive_patterns": [
      "Clear module separation by functionality",
      "Consistent SQL file naming"
    ],
    "recommended_conventions": {{
      "files": "snake_case for Python, PascalCase for classes",
      "directories": "lowercase with underscores",
      "configuration": "environment-prefixed naming"
    }}
  }},
  "modularity_assessment": {{
    "separation_quality": 72,
    "reusability_score": 58,
    "coupling_analysis": "Moderate - some tight coupling between modules",
    "cohesion_analysis": "Good - modules have clear responsibilities",
    "dependency_structure": [
      {{"module": "data_processing", "dependencies": ["utils", "config"], "coupling": "Low"}},
      {{"module": "reporting", "dependencies": ["data_processing", "templates"], "coupling": "Medium"}}
    ]
  }},
  "configuration_management": {{
    "config_organization": "Scattered - configuration mixed with code",
    "environment_separation": "Missing - no environment-specific configs",
    "security_assessment": "Risk - hardcoded credentials in some files",
    "recommendations": [
      "Centralize configuration in dedicated directory",
      "Implement environment-specific config files",
      "Externalize sensitive configuration"
    ]
  }},
  "build_and_deployment": {{
    "build_files_present": ["requirements.txt", "Dockerfile"],
    "deployment_readiness": "Partial - missing deployment scripts",
    "documentation_structure": "Minimal - README only",
    "testing_structure": "Missing - no test directories found"
  }},
  "improvement_opportunities": [
    {{
      "priority": "HIGH",
      "category": "organization",
      "action": "Implement standard project structure with src/, tests/, docs/, config/ directories",
      "effort": "Medium",
      "impact": "Significantly improves maintainability and onboarding"
    }},
    {{
      "priority": "MEDIUM",
      "category": "naming",
      "action": "Standardize naming conventions across all files",
      "effort": "Low",
      "impact": "Improves code readability and team collaboration"
    }}
  ],
  "ideal_structure_suggestion": {{
    "src/": "All source code organized by functionality",
    "tests/": "Unit and integration tests mirroring src structure",
    "docs/": "Documentation including API docs and user guides",
    "config/": "Environment-specific configuration files",
    "scripts/": "Build, deployment, and utility scripts",
    "data/": "Sample data and data schemas",
    "README.md": "Project overview and setup instructions"
  }}
}}

ASSESSMENT CRITERIA:
- Organization: Logical grouping, clear hierarchy, industry standards adherence
- Naming: Consistency, descriptiveness, convention following
- Modularity: Clear separation, low coupling, high cohesion
- Maintainability: Easy navigation, clear structure, scalable organization"""

        return prompt
    
    def _format_directory_structure(self, structure, indent=0):
        """Format directory structure for display"""
        result = ""
        for key, value in structure.items():
            result += "  " * indent + f"├── {key}/\n"
            if value:
                result += self._format_directory_structure(value, indent + 1)
        return result

##----------------------------------------------------------------------------------

class BusinessContextAgent(BaseSpecialistAgent):
    def __init__(self, log_dir="log"):
        super().__init__("business_context_agent", log_dir)
    
    def analyze(self, specialist_input):
        """Analyze business context, scale, and operational impact"""
        
        try:
            self._log_step("INIT", "Starting business context and scale analysis")
            
            project_context = specialist_input['project_context']
            chunks = specialist_input['chunks']
            
            # Prepare analysis prompt
            prompt = self._create_analysis_prompt(project_context, chunks)
            
            # Execute analysis
            result = self._execute_llm_analysis(prompt)
            
            # Save result and log
            self.analysis_log["final_result"] = result
            self._log_step("COMPLETE", "Business context analysis complete")
            self._save_log()
            
            return result
            
        except Exception as e:
            self._log_step("ERROR", f"Business context analysis failed: {str(e)}")
            self.analysis_log["error"] = str(e)
            self._save_log()
            raise
    
    def _create_analysis_prompt(self, project_context, chunks):
        """Create business context analysis prompt"""
        
        # Format chunks for analysis
        chunks_content = ""
        for chunk in chunks:
            chunks_content += f"\n{'='*60}\nCHUNK: {chunk['chunk_id']} ({chunk['file_count']} files)\n{'='*60}\n"
            chunks_content += chunk['content'][:15000]  # Limit chunk size
            if len(chunk['content']) > 15000:
                chunks_content += f"\n... [CONTENT TRUNCATED - Total: {chunk['content_chars']} chars]\n"
        
        prompt = f"""You are a Senior Business Analyst and Management Consultant specializing in technology impact assessment and business value analysis.

PROJECT OVERVIEW:
- Project Name: {project_context['name']}
- Primary Technology: {project_context['primary_technology']}
- All Technologies: {project_context['all_technologies']}
- Project Type: {project_context['project_type']}
- Total Files: {project_context['total_files']}
- Total Code Size: {project_context['total_size_chars']} characters

COMPLETE CODEBASE CONTENT:
{chunks_content}

ANALYSIS FOCUS:
Assess business scale, operational impact, and strategic value of the technology system based on code complexity, data processing patterns, and architectural decisions.

BUSINESS EXPERTISE:
- Scale Estimation: Transaction volumes, user capacity, operational throughput
- Impact Assessment: Business criticality, operational dependencies, risk factors
- Value Analysis: ROI potential, competitive advantages, strategic importance
- Operational Efficiency: Process automation, resource utilization, cost optimization

ANALYSIS TASKS:
1. Estimate business scale from code complexity and data processing patterns
2. Assess operational criticality and business dependencies
3. Evaluate competitive advantages and strategic value
4. Calculate operational efficiency and resource utilization
5. Provide business-focused recommendations with ROI considerations

OUTPUT (JSON only, no markdown, no explanations):
{{
  "business_scale_assessment": {{
    "estimated_scale": "Enterprise",
    "scale_indicators": [
      "Complex data processing algorithms indicating large datasets",
      "Parallel processing architecture for high throughput",
      "Multiple integration points suggesting enterprise complexity"
    ],
    "operational_metrics": {{
      "estimated_daily_transactions": "50K-100K based on processing complexity",
      "estimated_user_capacity": "500-1000 concurrent users",
      "data_volume_estimate": "Multi-gigabyte daily processing",
      "processing_throughput": "High-volume batch processing with real-time components"
    }},
    "confidence_level": 75
  }},
  "business_criticality": {{
    "criticality_level": "HIGH",
    "business_dependencies": [
      "Core operational processes depend on system availability",
      "Regulatory compliance requirements make system essential",
      "Financial calculations critical for business decisions"
    ],
    "downtime_impact": {{
      "financial_impact": "High - operational disruption affects revenue",
      "operational_impact": "Critical processes cannot function without system",
      "regulatory_impact": "Compliance reporting delays create regulatory risk"
    }},
    "business_continuity_assessment": 65
  }},
  "competitive_analysis": {{
    "competitive_advantages": [
      "Advanced analytical capabilities provide market insights",
      "Automated processing reduces operational costs",
      "Real-time processing enables faster decision making"
    ],
    "market_differentiation": "Moderate - technology provides operational efficiency gains",
    "innovation_level": 60,
    "strategic_value": "High for operational efficiency, medium for market differentiation"
  }},
  "operational_efficiency": {{
    "automation_level": 75,
    "process_optimization": [
      "Automated data processing reduces manual effort by estimated 80%",
      "Integrated workflow eliminates manual data transfer steps",
      "Parallel processing improves throughput by estimated 300%"
    ],
    "resource_utilization": 70,
    "cost_optimization_opportunities": [
      "Database query optimization could reduce processing time by 25%",
      "Automated monitoring could reduce operational overhead by 40%"
    ]
  }},
  "financial_assessment": {{
    "estimated_operational_cost_savings": "$200K-400K annually from automation",
    "infrastructure_efficiency": "Good - appropriate technology choices for scale",
    "maintenance_cost_projection": "Medium - requires skilled technical team",
    "roi_factors": [
      "Process automation reduces labor costs",
      "Improved accuracy reduces error-related costs",
      "Faster processing enables business agility"
    ]
  }},
  "discovered_business_purpose": "Financial data processing and compliance system",
  "estimated_business_scale": "enterprise",
  "improvement_opportunities": [
    {{
      "category": "scale_optimization",
      "recommendation": "Implement performance monitoring to validate scale estimates and optimize resource allocation",
      "business_impact": "Ensures system can handle projected growth",
      "roi_timeline": "6-12 months",
      "investment_estimate": "$50K-100K"
    }},
    {{
      "category": "business_continuity",
      "recommendation": "Develop comprehensive disaster recovery plan",
      "business_impact": "Reduces business risk and ensures operational continuity",
      "roi_timeline": "Immediate risk reduction",
      "investment_estimate": "$75K-150K"
    }}
  ],
  "growth_scalability": {{
    "current_capacity_utilization": "Estimated 60-70% of design capacity",
    "scaling_bottlenecks": ["Database performance", "Processing parallelization"],
    "growth_accommodation": "System can handle 2-3x current load with optimization",
    "scaling_investment_required": "$100K-200K for next growth phase"
  }}
}}

ESTIMATION METHODOLOGY:
- Analyze code complexity to infer data processing volumes
- Assess database operations and queries to estimate transaction rates
- Evaluate architectural patterns to determine scale requirements
- Use integration points and external dependencies to assess business scope
- Apply industry benchmarks and patterns for realistic estimates"""

        return prompt

##-------------------------------------------------------------------------------------

class PerformanceAnalysisAgent(BaseSpecialistAgent):
    def __init__(self, log_dir="log"):
        super().__init__("performance_analysis_agent", log_dir)
    
    def analyze(self, specialist_input):
        """Analyze system performance characteristics and optimization opportunities"""
        
        try:
            self._log_step("INIT", "Starting performance analysis")
            
            project_context = specialist_input['project_context']
            chunks = specialist_input['chunks']
            
            # Prepare analysis prompt
            prompt = self._create_analysis_prompt(project_context, chunks)
            
            # Execute analysis
            result = self._execute_llm_analysis(prompt)
            
            # Save result and log
            self.analysis_log["final_result"] = result
            self._log_step("COMPLETE", "Performance analysis complete")
            self._save_log()
            
            return result
            
        except Exception as e:
            self._log_step("ERROR", f"Performance analysis failed: {str(e)}")
            self.analysis_log["error"] = str(e)
            self._save_log()
            raise
    
    def _create_analysis_prompt(self, project_context, chunks):
        """Create performance analysis prompt"""
        
        # Format chunks for analysis
        chunks_content = ""
        for chunk in chunks:
            chunks_content += f"\n{'='*60}\nCHUNK: {chunk['chunk_id']} ({chunk['file_count']} files)\n{'='*60}\n"
            chunks_content += chunk['content'][:15000]  # Limit chunk size
            if len(chunk['content']) > 15000:
                chunks_content += f"\n... [CONTENT TRUNCATED - Total: {chunk['content_chars']} chars]\n"
        
        prompt = f"""You are a Senior Performance Engineer specializing in system optimization, bottleneck identification, and scalability analysis.

PROJECT OVERVIEW:
- Project Name: {project_context['name']}
- Primary Technology: {project_context['primary_technology']}
- All Technologies: {project_context['all_technologies']}
- Project Type: {project_context['project_type']}
- Total Files: {project_context['total_files']}

COMPLETE CODEBASE CONTENT:
{chunks_content}

ANALYSIS FOCUS:
Analyze system performance characteristics, identify bottlenecks, and provide specific optimization recommendations with quantified improvement estimates.

PERFORMANCE EXPERTISE:
- Algorithm Analysis: Complexity assessment, optimization opportunities
- Database Performance: Query optimization, indexing strategies, connection management
- System Architecture: Scalability bottlenecks, resource utilization, parallel processing
- Code Efficiency: Memory usage, CPU optimization, I/O efficiency

ANALYSIS TASKS:
1. Analyze algorithmic complexity and efficiency patterns
2. Identify performance bottlenecks in data processing workflows
3. Assess database query performance and optimization opportunities
4. Evaluate system resource utilization and scaling potential
5. Provide quantified optimization recommendations with expected improvements

OUTPUT (JSON only, no markdown, no explanations):
{{
  "performance_assessment": {{
    "overall_performance_score": 72,
    "performance_characteristics": {{
      "algorithmic_efficiency": 75,
      "database_performance": 65,
      "memory_utilization": 70,
      "io_efficiency": 68,
      "parallel_processing": 80
    }}
  }},
  "bottleneck_analysis": [
    {{
      "bottleneck": "Database query performance",
      "severity": "HIGH",
      "location": ["data_processor.sql", "report_generator.py"],
      "description": "Complex joins without proper indexing causing slow query execution",
      "performance_impact": "40-60% of total processing time",
      "affected_operations": ["Data loading", "Report generation"]
    }},
    {{
      "bottleneck": "Sequential processing loops",
      "severity": "MEDIUM", 
      "location": ["batch_processor.py"],
      "description": "Large dataset processing using single-threaded loops",
      "performance_impact": "25% longer processing time than optimal",
      "affected_operations": ["Batch data transformation"]
    }}
  ],
  "algorithm_analysis": [
    {{
      "algorithm": "Data deduplication logic",
      "current_complexity": "O(n²)",
      "files": ["dedup_processor.py"],
      "efficiency_assessment": "Inefficient for large datasets",
      "optimization_opportunity": "Hash-based deduplication could reduce to O(n)",
      "expected_improvement": "70-80% performance improvement for large datasets"
    }}
  ],
  "database_performance": {{
    "query_efficiency": 60,
    "indexing_opportunities": [
      {{
        "table": "transaction_data",
        "recommended_index": "CREATE INDEX idx_date_account ON transactions(date, account_id)",
        "expected_improvement": "50-70% faster query execution",
        "affected_queries": ["Daily transaction summaries", "Account analysis"]
      }}
    ],
    "connection_management": "Basic - could benefit from connection pooling",
    "query_optimization_potential": "High - multiple slow queries identified"
  }},
  "resource_utilization": {{
    "cpu_efficiency": 70,
    "memory_usage": "Moderate - some memory-intensive operations identified",
    "io_patterns": "Mixed - some inefficient file operations",
    "parallel_processing_utilization": 80,
    "resource_bottlenecks": ["Memory usage in large dataset processing", "I/O wait times"]
  }},
  "scalability_analysis": {{
    "current_throughput_estimate": "Processing 10K records/hour based on algorithm analysis",
    "scaling_limitations": [
      "Single-threaded processing limits parallel scalability",
      "Database connection limits restrict concurrent operations",
      "Memory usage grows linearly with dataset size"
    ],
    "horizontal_scaling_potential": "Good - architecture supports distributed processing",
    "vertical_scaling_potential": "Limited - bottlenecks are algorithmic, not resource-based"
  }},
  "improvement_opportunities": [
    {{
      "priority": "HIGH",
      "category": "database",
      "optimization": "Implement strategic database indexing",
      "implementation": "Add composite indexes on frequently queried columns",
      "expected_improvement": "50-70% query performance improvement",
      "effort_estimate": "1-2 weeks",
      "resource_requirement": "Database administrator time, minimal system resources"
    }},
    {{
      "priority": "HIGH",
      "category": "algorithm",
      "optimization": "Replace O(n²) deduplication with hash-based approach",
      "implementation": "Implement hash table for duplicate detection",
      "expected_improvement": "70-80% processing time reduction for large datasets",
      "effort_estimate": "2-3 weeks",
      "resource_requirement": "Additional memory allocation for hash tables"
    }},
    {{
      "priority": "MEDIUM",
      "category": "parallel_processing",
      "optimization": "Implement parallel processing for batch operations",
      "implementation": "Convert sequential loops to parallel processing using thread pools",
      "expected_improvement": "200-300% throughput improvement on multi-core systems",
      "effort_estimate": "3-4 weeks",
      "resource_requirement": "Multi-core processing environment"
    }}
  ],
  "performance_monitoring": {{
    "current_monitoring": "Basic - limited performance metrics available",
    "recommended_metrics": [
      "Query execution times",
      "Memory usage patterns",
      "Processing throughput rates",
      "System resource utilization"
    ],
    "monitoring_implementation": "Implement APM solution for comprehensive performance tracking"
  }},
  "capacity_planning": {{
    "current_capacity_estimate": "System handles current load at 60-70% capacity",
    "growth_projections": "Can accommodate 50% load increase with current architecture",
    "scaling_thresholds": "Optimization required when processing >50K records/hour",
    "infrastructure_requirements": "Additional memory and CPU cores for optimal scaling"
  }}
}}

ANALYSIS GUIDELINES:
- Focus on quantifiable performance metrics and improvements
- Identify specific bottlenecks with clear location references
- Provide realistic improvement estimates based on algorithm analysis
- Consider both current performance and future scalability requirements
- Prioritize optimizations by impact vs. implementation effort ratio"""

        return prompt

##-----------------------------------------------------------------------------------------------------
