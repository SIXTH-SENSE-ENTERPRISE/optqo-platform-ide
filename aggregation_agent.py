import json
from specialist_agents import BaseSpecialistAgent

class AggregationAgent(BaseSpecialistAgent):
    def __init__(self, log_dir="log"):
        super().__init__("aggregation_agent", log_dir)
    
    def synthesize_analysis(self, specialist_outputs, project_context):
        """Synthesize all specialist findings into unified analysis"""
        
        try:
            self._log_step("INIT", "Starting synthesis of specialist findings")
            
            # Validate and clean specialist outputs
            validated_outputs = self._validate_specialist_outputs(specialist_outputs)
            
            # Create synthesis prompt
            prompt = self._create_synthesis_prompt(validated_outputs, project_context)
            
            # Execute synthesis
            result = self._execute_llm_analysis(prompt)
            
            # Post-process result to match Agent 3 expected format
            formatted_result = self._format_for_agent3(result, validated_outputs)
            
            # Save result and log
            self.analysis_log["final_result"] = formatted_result
            self._log_step("COMPLETE", "Analysis synthesis complete")
            self._save_log()
            
            return formatted_result
            
        except Exception as e:
            self._log_step("ERROR", f"Synthesis failed: {str(e)}")
            self.analysis_log["error"] = str(e)
            self._save_log()
            raise
    
    def _validate_specialist_outputs(self, specialist_outputs):
        """Validate and extract key data from specialist outputs"""
        
        validated = {}
        
        # Extract and validate each specialist output
        for agent_name, output in specialist_outputs.items():
            if isinstance(output, dict) and 'error' not in output:
                validated[agent_name] = output
                self._log_step("VALIDATION", f"✅ {agent_name} output validated")
            else:
                self._log_step("VALIDATION", f"⚠️ {agent_name} failed - using partial data")
                validated[agent_name] = {"error": "Agent analysis failed", "partial_data": output}
        
        return validated
    
    def _create_synthesis_prompt(self, validated_outputs, project_context):
        """Create synthesis prompt for unified analysis"""
        
        # Format specialist findings for synthesis
        findings_summary = ""
        
        for agent_name, output in validated_outputs.items():
            findings_summary += f"\n{'='*50}\n{agent_name.upper()} FINDINGS:\n{'='*50}\n"
            findings_summary += json.dumps(output, indent=2, default=str)[:5000]  # Limit size
            if len(json.dumps(output, default=str)) > 5000:
                findings_summary += "\n... [TRUNCATED FOR LENGTH]\n"
        
        prompt = f"""You are a Senior Executive Consultant responsible for synthesizing technical analysis into strategic business recommendations.

PROJECT CONTEXT:
- Project: {project_context['name']}
- Technology: {project_context['primary_technology']}
- Scale: {project_context['total_files']} files
- Type: {project_context['project_type']}

SPECIALIST FINDINGS:
{findings_summary}

SYNTHESIS MISSION:
Transform specialist findings into unified executive analysis with strategic recommendations prioritized by business impact.

SYNTHESIS TASKS:
1. Consolidate quality assessments across all dimensions
2. Integrate architectural and performance findings
3. Synthesize business impact and scale estimates
4. Resolve conflicts between specialist assessments
5. Generate strategic recommendations prioritized by ROI

OUTPUT (JSON only, no markdown, no explanations):
{{
  "executive_summary": {{
    "overall_assessment": "System demonstrates strong operational capabilities with strategic optimization opportunities",
    "key_strengths": ["Robust core functionality", "Scalable architecture", "Strong business alignment"],
    "critical_concerns": ["Documentation gaps", "Performance bottlenecks", "Technical debt"],
    "business_readiness": "Production-ready with recommended improvements"
  }},
  "quality_assessment": {{
    "overall_quality_score": 72,
    "dimensional_scores": {{
      "functionality": {{"score": 85, "reasoning": "Core features work reliably with minor gaps"}},
      "code_organization": {{"score": 60, "reasoning": "Structure needs improvement for maintainability"}},
      "documentation": {{"score": 45, "reasoning": "Critical documentation missing throughout"}},
      "best_practices": {{"score": 68, "reasoning": "Generally follows standards with some deviations"}},
      "error_handling": {{"score": 55, "reasoning": "Basic error handling present but incomplete"}},
      "performance": {{"score": 75, "reasoning": "Performs well with optimization opportunities"}}
    }},
    "quality_trends": "Performance and functionality strong; documentation and organization need attention",
    "critical_quality_issues": [
      "Missing documentation poses operational risk",
      "Inconsistent error handling across modules",
      "Code organization hampers team productivity"
    ]
  }},
  "architecture_analysis": {{
    "system_pattern": "ETL_Pipeline_with_Parallel_Processing",
    "architecture_score": 75,
    "data_flow_complexity": "Moderate - clear stages with some optimization needed",
    "integration_quality": "Good - well-defined integration points",
    "scalability_rating": "Medium - can handle growth with targeted improvements",
    "architecture_strengths": [
      "Clear data processing pipeline",
      "Parallel processing capabilities",
      "Modular component design",
      "Appropriate technology choices"
    ],
    "architecture_concerns": [
      "Performance bottlenecks in database operations",
      "Limited error recovery mechanisms",
      "Manual configuration management",
      "Monitoring gaps in data pipeline"
    ]
  }},
  "business_assessment": {{
    "discovered_business_purpose": "Enterprise data processing and compliance system",
    "estimated_business_scale": "large",
    "business_criticality": "HIGH",
    "operational_impact": "System is mission-critical for daily operations",
    "estimated_business_value": "$2M+ annual operational value",
    "risk_assessment": "Medium risk due to documentation and maintenance challenges",
    "competitive_positioning": "Strong operational efficiency with room for innovation"
  }},
  "strategic_recommendations": [
    {{
      "priority": "HIGH",
      "category": "Risk Mitigation",
      "action": "Implement comprehensive documentation system",
      "business_justification": "Reduces operational risk and enables team scalability",
      "impact": "Decreases knowledge transfer time by 60%, reduces maintenance costs",
      "effort": "4-6 weeks",
      "roi_estimate": "300% within 12 months"
    }},
    {{
      "priority": "HIGH", 
      "category": "Performance Optimization",
      "action": "Optimize database operations and add strategic indexing",
      "business_justification": "Improves system throughput and user experience",
      "impact": "50-70% performance improvement in data processing",
      "effort": "2-3 weeks",
      "roi_estimate": "200% within 6 months"
    }},
    {{
      "priority": "MEDIUM",
      "category": "Code Quality",
      "action": "Restructure codebase for improved maintainability",
      "business_justification": "Reduces technical debt and improves team productivity",
      "impact": "25% reduction in development time for new features",
      "effort": "6-8 weeks",
      "roi_estimate": "150% within 18 months"
    }},
    {{
      "priority": "MEDIUM",
      "category": "Architecture",
      "action": "Implement monitoring and alerting system",
      "business_justification": "Proactive issue detection reduces downtime",
      "impact": "90% reduction in unplanned downtime",
      "effort": "3-4 weeks", 
      "roi_estimate": "400% within 12 months"
    }},
    {{
      "priority": "LOW",
      "category": "Innovation",
      "action": "Evaluate modern technology stack upgrade path",
      "business_justification": "Future-proofs system and enables advanced capabilities",
      "impact": "Access to modern features and improved developer experience",
      "effort": "8-12 weeks",
      "roi_estimate": "100% within 24 months"
    }}
  ],
  "analysis_metadata": {{
    "analysis_confidence": 85,
    "specialist_agents_successful": 6,
    "analysis_completion_time": "2025-01-23",
    "data_quality_score": 90,
    "recommendation_reliability": "HIGH"
  }}
}}

SYNTHESIS GUIDELINES:
- Prioritize recommendations by business impact and ROI
- Resolve conflicts between specialists using business context
- Ensure executive-level clarity and actionability
- Base assessments on evidence from multiple specialist perspectives
- Focus on strategic value over technical details"""

        return prompt
    
    def _format_for_agent3(self, synthesis_result, validated_outputs):
        """Format synthesis result to match Agent 3 expected input format"""
        
        # Agent 3 expects these specific fields
        formatted_result = {
            'quality_assessment': synthesis_result.get('quality_assessment', {}),
            'architecture_analysis': synthesis_result.get('architecture_analysis', {}),
            'business_assessment': synthesis_result.get('business_assessment', {}),
            'strategic_recommendations': synthesis_result.get('strategic_recommendations', []),
            'analysis_metadata': synthesis_result.get('analysis_metadata', {}),
            'executive_summary': synthesis_result.get('executive_summary', {})
        }
        
        # Add raw specialist outputs for debugging if needed
        formatted_result['_specialist_outputs'] = validated_outputs
        
        return formatted_result

    