import json
import boto3
from pathlib import Path
from datetime import datetime
import traceback

class CodeAnalysisAgent:
    def __init__(self, log_dir="log"):
        # Setup AWS Bedrock client
        self.client = boto3.client('bedrock-runtime', region_name='us-east-1')
        self.model_id = "arn:aws:bedrock:us-east-1:216989122843:inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0"
        
        # Setup logging
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = self.log_dir / f"agent2_analysis_{timestamp}.json"
        
        self.log_file = log_file
        self.analysis_log = {
            "timestamp": timestamp,
            "agent": "analysis_agent",
            "analysis_steps": [],
            "final_result": None
        }
        
        print(f"📝 Agent 2 logging to: {log_file}")
        
        # Context window management
        self.context_limit = 150000  # ~70% of Claude's context window
    
    def _log_step(self, step_name, description, data=None):
        """Log an analysis step"""
        step_info = {
            "step": step_name,
            "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "description": description
        }
        if data:
            step_info["data"] = data
        
        self.analysis_log["analysis_steps"].append(step_info)
        print(f"🔄 {step_name}: {description}")
    
    def _save_log(self):
        """Save the analysis log to file"""
        try:
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump(self.analysis_log, f, indent=2, default=str)
            print(f"💾 Agent 2 log saved to: {self.log_file}")
        except Exception as e:
            print(f"⚠️ Failed to save Agent 2 log: {e}")
    
    def analyze_codebase(self, agent1_output):
        """Main analysis function that processes Agent 1 output"""
        try:
            self._log_step("INIT", "Starting comprehensive codebase analysis")
            
            # Determine analysis approach
            chunking_decision = agent1_output['chunking_decision']
            
            if not chunking_decision['needs_chunking']:
                self._log_step("STRATEGY", "Single-pass analysis selected")
                result = self._single_pass_analysis(agent1_output)
            else:
                self._log_step("STRATEGY", f"Multi-chunk analysis selected: {chunking_decision['recommended_chunks']} chunks")
                result = self._multi_chunk_analysis(agent1_output)
            
            # Add metadata
            result['analysis_metadata'] = {
                'analysis_approach': 'single_pass' if not chunking_decision['needs_chunking'] else 'multi_chunk',
                'total_files_analyzed': agent1_output['project_overview']['total_files'],
                'analysis_timestamp': datetime.now().isoformat(),
                'agent_version': '2.0'
            }
            
            self.analysis_log["final_result"] = result
            self._log_step("COMPLETE", "Comprehensive analysis complete")
            self._save_log()
            
            return result
            
        except Exception as e:
            self._log_step("ERROR", f"Analysis failed: {str(e)}")
            self.analysis_log["error"] = {
                "message": str(e),
                "traceback": traceback.format_exc()
            }
            self._save_log()
            raise
    
    def _single_pass_analysis(self, agent1_output):
        """Analyze small projects in single pass"""
        
        # Read all file contents
        self._log_step("CONTENT_LOADING", "Loading all file contents")
        all_content = self._load_all_file_contents(agent1_output['file_catalog'])
        
        # Prepare comprehensive analysis prompt
        analysis_prompt = self._create_comprehensive_analysis_prompt(agent1_output, all_content)
        
        # Execute LLM analysis
        self._log_step("LLM_ANALYSIS", "Executing comprehensive LLM analysis")
        analysis_result = self._execute_llm_analysis(analysis_prompt)
        
        return analysis_result
    
    def _multi_chunk_analysis(self, agent1_output):
        """Analyze large projects in chunks with context preservation"""
        
        # Create chunks based on Agent 1's chunking decision
        self._log_step("CHUNK_CREATION", "Creating file chunks for analysis")
        chunks = self._create_analysis_chunks(agent1_output)
        
        # Initialize context preservation
        running_context = {
            'business_purpose': None,
            'architectural_insights': [],
            'quality_trends': {},
            'critical_findings': [],
            'chunks_processed': 0,
            'total_chunks': len(chunks)
        }
        
        chunk_results = []
        
        # Process each chunk
        for chunk_index, chunk in enumerate(chunks):
            self._log_step("CHUNK_ANALYSIS", f"Analyzing chunk {chunk_index + 1} of {len(chunks)}: {chunk['chunk_id']}")
            
            # Analyze chunk with context
            chunk_result = self._analyze_chunk_with_context(chunk, running_context, agent1_output)
            chunk_results.append(chunk_result)
            
            # Update running context
            self._update_running_context(running_context, chunk_result)
            
        # Synthesize final analysis
        self._log_step("SYNTHESIS", "Synthesizing final comprehensive analysis")
        final_result = self._synthesize_multi_chunk_analysis(chunk_results, running_context, agent1_output)
        
        return final_result
    
    def _create_analysis_chunks(self, agent1_output):
        """Create chunks for analysis based on Agent 1's chunking decision"""
        file_catalog = agent1_output['file_catalog']
        total_chars = agent1_output['project_overview']['total_size_chars']
        recommended_chunks = agent1_output['chunking_decision']['recommended_chunks']
        
        # Simple size-based chunking as discussed
        chunk_size_target = total_chars // recommended_chunks
        chunks = []
        current_chunk = []
        current_size = 0
        
        # Sort files by size for better distribution
        sorted_files = sorted(
            file_catalog['all_files'], 
            key=lambda x: x.get('size_chars', 0), 
            reverse=True
        )
        
        for file_info in sorted_files:
            file_size = file_info.get('size_chars', 0)
            
            # If adding this file exceeds target, start new chunk
            if current_size + file_size > chunk_size_target and current_chunk:
                chunks.append({
                    'chunk_id': f"chunk_{len(chunks) + 1}",
                    'files': current_chunk.copy(),
                    'estimated_chars': current_size,
                    'file_count': len(current_chunk)
                })
                current_chunk = []
                current_size = 0
            
            current_chunk.append(file_info)
            current_size += file_size
        
        # Add remaining files as final chunk
        if current_chunk:
            chunks.append({
                'chunk_id': f"chunk_{len(chunks) + 1}",
                'files': current_chunk,
                'estimated_chars': current_size,
                'file_count': len(current_chunk)
            })
        
        return chunks
    
    def _load_all_file_contents(self, file_catalog):
        """Load content of all text files"""
        all_content = {}
        
        for file_info in file_catalog['all_files']:
            if file_info.get('is_text', False):
                try:
                    with open(file_info['absolute_path'], 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        all_content[file_info['name']] = {
                            'path': file_info['path'],
                            'content': content,
                            'size': len(content)
                        }
                except Exception as e:
                    print(f"⚠️ Could not read file {file_info['name']}: {e}")
                    all_content[file_info['name']] = {
                        'path': file_info['path'],
                        'content': f"[Could not read file: {e}]",
                        'size': 0
                    }
        
        return all_content
    
    def _create_comprehensive_analysis_prompt(self, agent1_output, all_content):
        """Create comprehensive analysis prompt for single-pass analysis"""
        
        project_overview = agent1_output['project_overview']
        tech_stack = agent1_output['technology_stack']
        project_type = agent1_output['project_type']
        
        # Format file contents for prompt
        formatted_content = ""
        for filename, file_data in all_content.items():
            formatted_content += f"\n{'='*50}\nFILE: {filename}\nPATH: {file_data['path']}\n{'='*50}\n"
            formatted_content += file_data['content'][:10000]  # Limit to prevent context overflow
            if len(file_data['content']) > 10000:
                formatted_content += f"\n... [TRUNCATED - Total size: {file_data['size']} characters]"
            formatted_content += "\n\n"
        
        prompt = f"""You are an expert code analyst conducting a comprehensive assessment of this codebase for a professional consulting report.

PROJECT CONTEXT:
- Project Name: {project_overview['name']}
- Project Type: {project_type}
- Total Files: {project_overview['total_files']}
- Primary Technology: {tech_stack['primary_technology']}
- All Technologies: {list(tech_stack['all_technologies'].keys())}

COMPLETE CODEBASE:
{formatted_content}

ANALYSIS REQUIREMENTS:
Provide a comprehensive analysis in EXACTLY this JSON format (respond with ONLY valid JSON, no markdown or explanations):

{{
  "quality_assessment": {{
    "overall_quality_score": 0-100,
    "dimensional_scores": {{
      "functionality": {{
        "score": 0-100,
        "reasoning": "detailed assessment of how well the code works",
        "strengths": ["specific working features", "robust algorithms"],
        "weaknesses": ["specific issues found", "missing functionality"]
      }},
      "code_organization": {{
        "score": 0-100,
        "reasoning": "assessment of structure, modularity, maintainability",
        "strengths": ["clear separation", "logical flow"],
        "weaknesses": ["mixed responsibilities", "unclear naming"]
      }},
      "documentation": {{
        "score": 0-100,
        "reasoning": "comments, documentation, self-explaining code assessment",
        "strengths": ["clear business context", "good comments"],
        "weaknesses": ["missing docs", "unclear purpose"]
      }},
      "best_practices": {{
        "score": 0-100,
        "reasoning": "platform-specific standards and conventions adherence",
        "strengths": ["follows standards", "good patterns"],
        "weaknesses": ["deprecated functions", "anti-patterns"]
      }},
      "error_handling": {{
        "score": 0-100,
        "reasoning": "exception management and robustness assessment",
        "strengths": ["comprehensive error handling", "graceful degradation"],
        "weaknesses": ["missing error scenarios", "poor exception handling"]
      }},
      "performance": {{
        "score": 0-100,
        "reasoning": "efficiency, optimization, and scalability assessment",
        "strengths": ["efficient algorithms", "optimized queries"],
        "weaknesses": ["performance bottlenecks", "scalability issues"]
      }}
    }}
  }},
  "architecture_analysis": {{
    "system_pattern": "ETL_Pipeline|Microservices|Monolith|Data_Processing|Web_Application",
    "data_flow_stages": ["stage1", "stage2", "stage3"],
    "critical_components": [
      {{
        "component_name": "specific component name",
        "criticality": "CRITICAL|HIGH|MEDIUM|LOW",
        "business_function": "what this component does for business",
        "technical_function": "technical purpose"
      }}
    ],
    "integration_points": ["database", "external_apis", "file_system"],
    "architecture_strengths": ["clear data flow", "good separation"],
    "architecture_concerns": ["single point of failure", "tight coupling"],
    "scalability_assessment": "assessment of system's ability to scale"
  }},
  "business_assessment": {{
    "discovered_business_purpose": "specific business problem this system solves",
    "estimated_business_scale": "enterprise|large|medium|small with reasoning",
    "estimated_transaction_volume": "realistic estimate based on code complexity and data processing patterns",
    "regulatory_compliance_aspects": ["compliance requirements found in code"],
    "business_criticality": "HIGH|MEDIUM|LOW with justification",
    "operational_efficiency": "percentage estimate with reasoning",
    "risk_assessment": {{
      "high_risks": ["specific risks that could impact business"],
      "medium_risks": ["moderate risks identified"],
      "low_risks": ["minor risks found"]
    }},
    "competitive_advantages": ["unique features or capabilities identified"]
  }},
  "strategic_recommendations": [
    {{
      "priority": "HIGH|MEDIUM|LOW",
      "recommendation": "specific actionable recommendation",
      "business_justification": "why this matters to business operations",
      "technical_approach": "how to implement this recommendation",
      "effort_estimate": "realistic time estimate",
      "success_metrics": ["measurable outcomes"],
      "roi_projection": "estimated return on investment"
    }}
  ],
  "performance_analysis": {{
    "current_performance_metrics": {{
      "estimated_throughput": "records/transactions per day based on code analysis",
      "estimated_uptime": "percentage based on error handling quality",
      "processing_efficiency": "assessment of computational efficiency"
    }},
    "optimization_opportunities": [
      {{
        "optimization": "specific optimization identified",
        "potential_improvement": "quantified improvement estimate",
        "implementation_complexity": "LOW|MEDIUM|HIGH"
      }}
    ]
  }}
}}

ANALYSIS GUIDELINES:
1. Base all assessments on actual code patterns you observe
2. Provide realistic business metrics based on code complexity and data processing patterns
3. Make educated estimates for transaction volumes based on database operations, file processing, and computational complexity
4. Identify regulatory compliance aspects from comments, variable names, and business logic
5. Prioritize recommendations by business impact and implementation feasibility
6. Ensure all scores are justified by specific evidence from the codebase"""

        return prompt
    
    def _execute_llm_analysis(self, prompt):
        """Execute LLM analysis using AWS Bedrock"""
        try:
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
                return analysis_result
            except json.JSONDecodeError as e:
                print(f"⚠️ Failed to parse LLM response as JSON: {e}")
                print(f"Raw response: {response_content[:500]}...")
                
                # Return a fallback structure
                return {
                    "error": "Failed to parse LLM response",
                    "raw_response": response_content,
                    "quality_assessment": {
                        "overall_quality_score": 50,
                        "dimensional_scores": {}
                    }
                }
                
        except Exception as e:
            print(f"❌ LLM analysis failed: {e}")
            raise
    
    def _analyze_chunk_with_context(self, chunk, running_context, agent1_output):
        """Analyze a single chunk with preserved context"""
        
        # Load chunk content
        chunk_content = {}
        for file_info in chunk['files']:
            if file_info.get('is_text', False):
                try:
                    with open(file_info['absolute_path'], 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        chunk_content[file_info['name']] = {
                            'path': file_info['path'],
                            'content': content[:8000],  # Limit per file for context management
                            'size': len(content)
                        }
                except Exception as e:
                    chunk_content[file_info['name']] = {
                        'path': file_info['path'],
                        'content': f"[Could not read file: {e}]",
                        'size': 0
                    }
        
        # Format chunk content
        formatted_content = ""
        for filename, file_data in chunk_content.items():
            formatted_content += f"\n{'='*40}\nFILE: {filename}\n{'='*40}\n"
            formatted_content += file_data['content']
            formatted_content += "\n\n"
        
        # Create chunk analysis prompt
        chunk_prompt = self._create_chunk_analysis_prompt(
            chunk, formatted_content, running_context, agent1_output
        )
        
        # Execute analysis
        chunk_result = self._execute_llm_analysis(chunk_prompt)
        
        return chunk_result
    
    def _create_chunk_analysis_prompt(self, chunk, formatted_content, running_context, agent1_output):
        """Create prompt for chunk analysis"""
        
        project_overview = agent1_output['project_overview']
        tech_stack = agent1_output['technology_stack']
        
        context_str = ""
        if running_context['business_purpose']:
            context_str += f"Business Purpose: {running_context['business_purpose']}\n"
        if running_context['architectural_insights']:
            context_str += f"Architecture Insights: {running_context['architectural_insights']}\n"
        if running_context['critical_findings']:
            context_str += f"Critical Findings: {running_context['critical_findings']}\n"
        
        prompt = f"""You are analyzing chunk {running_context['chunks_processed'] + 1} of {running_context['total_chunks']} in a {tech_stack['primary_technology']} system.

PROJECT CONTEXT:
- Project: {project_overview['name']}
- Primary Technology: {tech_stack['primary_technology']}

RUNNING CONTEXT FROM PREVIOUS CHUNKS:
{context_str}

CURRENT CHUNK - {chunk['chunk_id']}:
Files: {chunk['file_count']} files, ~{chunk['estimated_chars']} characters

CHUNK CONTENT:
{formatted_content}

Analyze this chunk and provide analysis in EXACTLY this JSON format:

{{
  "chunk_analysis": {{
    "chunk_name": "{chunk['chunk_id']}",
    "primary_function": "what this chunk does in the system",
    "quality_scores": {{
      "functionality": {{"score": 0-100, "reasoning": "assessment"}},
      "code_organization": {{"score": 0-100, "reasoning": "assessment"}},
      "documentation": {{"score": 0-100, "reasoning": "assessment"}},
      "best_practices": {{"score": 0-100, "reasoning": "assessment"}},
      "error_handling": {{"score": 0-100, "reasoning": "assessment"}},
      "performance": {{"score": 0-100, "reasoning": "assessment"}}
    }},
    "architectural_contribution": "how this chunk fits in the overall system",
    "critical_issues": [
      {{
        "issue": "specific problem found",
        "severity": "HIGH|MEDIUM|LOW",
        "files": ["affected files"],
        "business_impact": "impact on business operations"
      }}
    ],
    "chunk_recommendations": [
      {{
        "priority": "HIGH|MEDIUM|LOW",
        "action": "specific recommendation",
        "effort": "time estimate",
        "impact": "business benefit"
      }}
    ]
  }},
  "context_updates": {{
    "business_insights": "new understanding about business purpose",
    "architectural_discoveries": "new architectural insights",
    "quality_patterns": "quality trends observed"
  }}
}}"""
        
        return prompt
    
    def _update_running_context(self, running_context, chunk_result):
        """Update running context with chunk analysis results"""
        
        if 'chunk_analysis' in chunk_result:
            chunk_analysis = chunk_result['chunk_analysis']
            
            # Update quality trends
            for dimension, score_data in chunk_analysis.get('quality_scores', {}).items():
                if dimension not in running_context['quality_trends']:
                    running_context['quality_trends'][dimension] = []
                running_context['quality_trends'][dimension].append(score_data.get('score', 50))
            
            # Add critical issues
            running_context['critical_findings'].extend(
                chunk_analysis.get('critical_issues', [])
            )
            
            # Update architectural insights
            arch_contribution = chunk_analysis.get('architectural_contribution')
            if arch_contribution:
                running_context['architectural_insights'].append(arch_contribution)
        
        # Update business purpose if discovered
        context_updates = chunk_result.get('context_updates', {})
        if context_updates.get('business_insights') and not running_context['business_purpose']:
            running_context['business_purpose'] = context_updates['business_insights']
        
        running_context['chunks_processed'] += 1
    
    def _synthesize_multi_chunk_analysis(self, chunk_results, running_context, agent1_output):
        """Synthesize final analysis from all chunk results"""
        
        # Calculate overall quality scores from trends
        overall_scores = {}
        for dimension, scores in running_context['quality_trends'].items():
            if scores:
                overall_scores[dimension] = {
                    'score': round(sum(scores) / len(scores)),
                    'reasoning': f"Average across {len(scores)} chunks",
                    'trend': 'stable' if max(scores) - min(scores) < 20 else 'variable'
                }
        
        # Calculate overall quality score
        dimension_scores = [score_data['score'] for score_data in overall_scores.values()]
        overall_quality_score = round(sum(dimension_scores) / len(dimension_scores)) if dimension_scores else 50
        
        # Synthesize architecture analysis
        architecture_analysis = {
            'system_pattern': self._determine_system_pattern(running_context['architectural_insights']),
            'critical_components': self._extract_critical_components(chunk_results),
            'architecture_strengths': self._extract_strengths(chunk_results),
            'architecture_concerns': self._extract_concerns(running_context['critical_findings'])
        }
        
        # Create business assessment
        business_assessment = self._create_business_assessment(
            running_context, agent1_output, overall_quality_score
        )
        
        # Aggregate recommendations
        all_recommendations = []
        for chunk_result in chunk_results:
            if 'chunk_analysis' in chunk_result:
                chunk_recs = chunk_result['chunk_analysis'].get('chunk_recommendations', [])
                all_recommendations.extend(chunk_recs)
        
        # Sort recommendations by priority
        priority_order = {'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}
        all_recommendations.sort(key=lambda x: priority_order.get(x.get('priority', 'LOW'), 1), reverse=True)
        
        return {
            'quality_assessment': {
                'overall_quality_score': overall_quality_score,
                'dimensional_scores': overall_scores
            },
            'architecture_analysis': architecture_analysis,
            'business_assessment': business_assessment,
            'strategic_recommendations': all_recommendations[:10],  # Top 10 recommendations
            'chunk_details': chunk_results
        }
    
    def _determine_system_pattern(self, architectural_insights):
        """Determine system pattern from architectural insights"""
        insights_text = ' '.join(architectural_insights).lower()
        
        if 'etl' in insights_text or 'pipeline' in insights_text or 'processing' in insights_text:
            return 'ETL_Pipeline'
        elif 'api' in insights_text or 'service' in insights_text:
            return 'Service_Architecture'
        elif 'web' in insights_text or 'frontend' in insights_text:
            return 'Web_Application'
        else:
            return 'Data_Processing'
    
    def _extract_critical_components(self, chunk_results):
        """Extract critical components from chunk analyses"""
        components = []
        
        for chunk_result in chunk_results:
            if 'chunk_analysis' in chunk_result:
                chunk_analysis = chunk_result['chunk_analysis']
                
                # Look for high-severity issues or critical functions
                for issue in chunk_analysis.get('critical_issues', []):
                    if issue.get('severity') == 'HIGH':
                        components.append({
                            'component_name': issue.get('files', ['Unknown'])[0],
                            'criticality': 'CRITICAL',
                            'business_function': issue.get('business_impact', 'Critical system component'),
                            'technical_function': issue.get('issue', 'Core functionality')
                        })
        
        return components[:5]  # Top 5 critical components
    
    def _extract_strengths(self, chunk_results):
        """Extract architectural strengths from analysis"""
        strengths = []
        
        for chunk_result in chunk_results:
            if 'chunk_analysis' in chunk_result:
                chunk_analysis = chunk_result['chunk_analysis']
                
                # Extract high-scoring aspects
                for dimension, score_data in chunk_analysis.get('quality_scores', {}).items():
                    if score_data.get('score', 0) > 75:
                        strengths.append(f"Strong {dimension}: {score_data.get('reasoning', '')}")
        
        return list(set(strengths))[:5]  # Unique strengths, top 5
    
    def _extract_concerns(self, critical_findings):
        """Extract architectural concerns from critical findings"""
        concerns = []
        
        for finding in critical_findings:
            if finding.get('severity') in ['HIGH', 'MEDIUM']:
                concerns.append(finding.get('issue', 'Unknown issue'))
        
        return list(set(concerns))[:5]  # Unique concerns, top 5
    
    def _create_business_assessment(self, running_context, agent1_output, overall_quality_score):
        """Create business assessment based on analysis"""
        
        project_name = agent1_output['project_overview']['name']
        primary_tech = agent1_output['technology_stack']['primary_technology']
        total_files = agent1_output['project_overview']['total_files']
        total_chars = agent1_output['project_overview']['total_size_chars']
        
        # Estimate business scale based on code complexity
        if total_files > 50 and total_chars > 500000:
            business_scale = "enterprise"
            estimated_throughput = "100K+ records/day"
        elif total_files > 20 and total_chars > 100000:
            business_scale = "large"
            estimated_throughput = "10K+ records/day"
        else:
            business_scale = "medium"
            estimated_throughput = "1K+ records/day"
        
        # Estimate uptime based on error handling quality
        error_handling_scores = running_context['quality_trends'].get('error_handling', [50])
        avg_error_handling = sum(error_handling_scores) / len(error_handling_scores)
        estimated_uptime = f"{min(95 + (avg_error_handling / 10), 99.9):.1f}%"
        
        return {
            'discovered_business_purpose': running_context.get('business_purpose', f"{primary_tech} based {project_name} system"),
            'estimated_business_scale': business_scale,
            'estimated_transaction_volume': estimated_throughput,
            'business_criticality': 'HIGH' if overall_quality_score > 70 else 'MEDIUM',
            'operational_efficiency': f"{overall_quality_score}%",
            'risk_assessment': {
                'high_risks': [f['issue'] for f in running_context['critical_findings'] if f.get('severity') == 'HIGH'][:3],
                'medium_risks': [f['issue'] for f in running_context['critical_findings'] if f.get('severity') == 'MEDIUM'][:3],
                'low_risks': []
            },
            'performance_metrics': {
                'estimated_uptime': estimated_uptime,
                'processing_efficiency': f"Good for {business_scale} scale operations"
            }
        }

# Test function
def test_analysis_agent(agent1_output):
    """Test the analysis agent with Agent 1 output"""
    agent = CodeAnalysisAgent()
    
    try:
        result = agent.analyze_codebase(agent1_output)
        
        print("\n🔬 ANALYSIS RESULTS")
        print("=" * 50)
        print(f"Overall Quality Score: {result.get('quality_assessment', {}).get('overall_quality_score', 'N/A')}")
        print(f"Analysis Approach: {result.get('analysis_metadata', {}).get('analysis_approach', 'N/A')}")
        
        return result
        
    except Exception as e:
        print(f"❌ Analysis Error: {e}")
        return None