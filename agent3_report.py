import json
from pathlib import Path
from datetime import datetime
import html


class EnhancedReportGenerationAgent:
    def __init__(self, log_dir="log"):
        # Setup logging
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = self.log_dir / f"enhanced_agent3_report_{timestamp}.json"
        
        self.log_file = log_file
        self.analysis_log = {
            "timestamp": timestamp,
            "agent": "enhanced_report_generation_agent",
            "analysis_steps": [],
            "final_result": None
        }
        
        print(f"📝 Enhanced Agent 3 logging to: {log_file}")
        
        # Report output directory
        self.reports_dir = Path("reports")
        self.reports_dir.mkdir(exist_ok=True)
    
    def _log_step(self, step_name, description, data=None):
        """Log a report generation step"""
        step_info = {
            "step": step_name,
            "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "description": description
        }
        if data:
            step_info["data"] = data
        
        self.analysis_log["analysis_steps"].append(step_info)
        print(f"🔄 ENHANCED AGENT 3: {description}")
    
    def _save_log(self):
        """Save the analysis log to file"""
        try:
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump(self.analysis_log, f, indent=2, default=str)
            print(f"💾 Enhanced Agent 3 log saved to: {self.log_file}")
        except Exception as e:
            print(f"⚠️ Failed to save Enhanced Agent 3 log: {e}")
    
    def generate_report(self, agent1_output, agent2_output):
        """Generate comprehensive professional HTML report from analysis results"""
        try:
            self._log_step("INIT", "Starting enhanced professional report generation")
            
            # Extract comprehensive information
            project_info = self._extract_comprehensive_project_info(agent1_output, agent2_output)
            
            # Generate HTML content
            self._log_step("HTML_GENERATION", "Generating comprehensive HTML content")
            html_content = self._generate_comprehensive_html_report(project_info)
            
            # Save report
            self._log_step("SAVE_REPORT", "Saving enhanced HTML report")
            report_path = self._save_html_report(html_content, project_info['project_name'])
            
            result = {
                'report_path': str(report_path),
                'project_name': project_info['project_name'],
                'generation_timestamp': datetime.now().isoformat(),
                'report_type': 'enhanced_comprehensive'
            }
            
            self.analysis_log["final_result"] = result
            self._log_step("COMPLETE", f"Enhanced report generated: {report_path}")
            self._save_log()
            
            return result
            
        except Exception as e:
            self._log_step("ERROR", f"Enhanced report generation failed: {str(e)}")
            self.analysis_log["error"] = str(e)
            self._save_log()
            raise
    
    def _extract_comprehensive_project_info(self, agent1_output, agent2_output):
        """Extract and organize ALL available information for comprehensive reporting"""
        
        # Basic project information
        project_overview = agent1_output.get('project_overview', {})
        
        # Main synthesis results
        quality_assessment = agent2_output.get('quality_assessment', {})
        architecture_analysis = agent2_output.get('architecture_analysis', {})
        business_assessment = agent2_output.get('business_assessment', {})
        strategic_recommendations = agent2_output.get('strategic_recommendations', [])
        executive_summary = agent2_output.get('executive_summary', {})
        
        # CRUCIAL: Extract detailed specialist outputs
        specialist_outputs = agent2_output.get('_specialist_outputs', {})
        
        return {
            # Basic info
            'project_name': project_overview.get('name', 'Unknown Project'),
            'project_path': project_overview.get('path', ''),
            
            # Core assessments
            'quality_assessment': quality_assessment,
            'architecture_analysis': architecture_analysis,
            'business_assessment': business_assessment,
            'strategic_recommendations': strategic_recommendations,
            'executive_summary': executive_summary,
            
            # Detailed specialist findings
            'technology_details': specialist_outputs.get('technology_detection', {}),
            'quality_details': specialist_outputs.get('code_quality', {}),
            'architecture_details': specialist_outputs.get('architecture_dataflow', {}),
            'performance_details': specialist_outputs.get('performance_analysis', {}),
            'business_details': specialist_outputs.get('business_context', {}),
            'file_structure_details': specialist_outputs.get('file_structure', {}),
            
            # Metadata
            'analysis_metadata': agent2_output.get('analysis_metadata', {}),
            'agent1_data': agent1_output
        }
    
    def _generate_comprehensive_html_report(self, project_info):
        """Generate the complete comprehensive HTML report"""
        
        # Generate each section with full data
        enhanced_executive_summary = self._generate_enhanced_executive_summary(project_info)
        comprehensive_technology_stack = self._generate_comprehensive_technology_stack(project_info)
        detailed_quality_dashboard = self._generate_detailed_quality_dashboard(project_info)
        system_architecture_analysis = self._generate_system_architecture_analysis(project_info)
        file_analysis_section = self._generate_file_analysis_section(project_info)
        performance_optimization_analysis = self._generate_performance_optimization_analysis(project_info)
        comprehensive_recommendations = self._generate_comprehensive_recommendations(project_info)
        
        # Combine into full HTML
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>optqo Platform - {html.escape(project_info['project_name'])} Analysis Report</title>
    {self._get_enhanced_css_styles()}
</head>
<body>
    {self._generate_enhanced_header(project_info)}
    
    <div class="container">
        {self._generate_enhanced_report_title(project_info)}
        {enhanced_executive_summary}
        {comprehensive_technology_stack}
        {detailed_quality_dashboard}
        {system_architecture_analysis}
        {file_analysis_section}
        {performance_optimization_analysis}
        {comprehensive_recommendations}
    </div>
    
    {self._generate_enhanced_footer()}
</body>
</html>"""
        
        return html_content
    
    def _get_enhanced_css_styles(self):
        """Return comprehensive CSS styling for the enhanced report"""
        return """
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.5;
            color: #414042;
            background: #fafafa;
            font-size: 14px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .header {
            background: white;
            border-bottom: 1px solid #e5e7eb;
            padding: 15px 0;
            margin-bottom: 25px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo {
            width: 35px;
            height: 35px;
            background: linear-gradient(135deg, #0098c2 0%, #8f53a1 100%);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
        }

        .brand-text h1 {
            font-size: 20px;
            font-weight: 600;
            color: #414042;
            margin-bottom: 2px;
        }

        .brand-text p {
            font-size: 11px;
            color: #919396;
            font-weight: 500;
        }

        .report-info {
            text-align: right;
            font-size: 11px;
            color: #919396;
        }

        .report-title {
            background: white;
            padding: 25px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            margin-bottom: 25px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .report-title h2 {
            font-size: 24px;
            font-weight: 600;
            color: #414042;
            margin-bottom: 5px;
        }

        .report-title p {
            color: #919396;
            font-size: 14px;
        }

        .section {
            background: white;
            padding: 25px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .section h3 {
            font-size: 18px;
            font-weight: 600;
            color: #414042;
            margin-bottom: 15px;
            border-bottom: 2px solid #0098c2;
            padding-bottom: 5px;
        }

        .section h4 {
            font-size: 16px;
            font-weight: 600;
            color: #414042;
            margin: 15px 0 8px 0;
        }

        .section h5 {
            font-size: 14px;
            font-weight: 600;
            color: #414042;
            margin: 10px 0 5px 0;
        }

        .executive-content {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 25px;
            margin-top: 15px;
        }

        .status-explanation {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }

        .status-item {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }

        .status-badge {
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            min-width: 100px;
            text-align: center;
        }

        .status-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .status-warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }

        .status-danger {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }

        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            text-align: center;
            transition: transform 0.2s ease;
        }

        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .metric-value {
            font-size: 28px;
            font-weight: 700;
            color: #0098c2;
            margin-bottom: 5px;
        }

        .metric-label {
            font-size: 12px;
            color: #919396;
            font-weight: 500;
        }

        .quality-bar {
            background: #e9ecef;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            margin: 8px 0;
            position: relative;
        }

        .quality-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
            position: relative;
        }

        .quality-excellent { background: #28a745; }
        .quality-good { background: #0098c2; }
        .quality-average { background: #ffc107; }
        .quality-poor { background: #dc3545; }

        .tech-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }

        .tech-item {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            transition: transform 0.2s ease;
        }

        .tech-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .tech-icon {
            font-size: 24px;
            color: #0098c2;
        }

        .tech-name {
            font-size: 12px;
            font-weight: 600;
            color: #414042;
        }

        .flowchart {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            margin: 15px 0;
        }

        .flow-step {
            background: white;
            padding: 12px 15px;
            border-radius: 6px;
            border: 1px solid #0098c2;
            margin: 8px 0;
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            color: #0098c2;
            box-shadow: 0 2px 4px rgba(0,152,194,0.1);
        }

        .flow-arrow {
            text-align: center;
            color: #919396;
            font-size: 16px;
            margin: 2px 0;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 13px;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .data-table th,
        .data-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }

        .data-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #414042;
            font-size: 12px;
        }

        .data-table tr:hover {
            background: #f8f9fa;
        }

        .priority-high {
            background: #f8d7da;
            color: #721c24;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
        }

        .priority-medium {
            background: #fff3cd;
            color: #856404;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
        }

        .priority-low {
            background: #d4edda;
            color: #155724;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
        }

        .performance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 15px 0;
        }

        .performance-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            transition: transform 0.2s ease;
        }

        .performance-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .performance-card h5 {
            font-size: 14px;
            font-weight: 600;
            color: #414042;
            margin-bottom: 12px;
            border-bottom: 2px solid #0098c2;
            padding-bottom: 5px;
        }

        .performance-list {
            list-style: none;
            padding: 0;
        }

        .performance-list li {
            padding: 6px 0;
            font-size: 12px;
            color: #666;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: flex-start;
            gap: 8px;
        }

        .performance-list li:last-child {
            border-bottom: none;
        }

        .performance-list li:before {
            content: "✓";
            color: #28a745;
            font-weight: bold;
            flex-shrink: 0;
        }

        .optimization-list li:before {
            content: "⚡";
            color: #ffc107;
        }

        .risk-list li:before {
            content: "⚠️";
            color: #dc3545;
        }

        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
        }

        .three-column {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
        }

        .bottleneck-card {
            background: #fff5f5;
            border: 1px solid #fed7d7;
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
        }

        .bottleneck-high { border-left: 4px solid #dc3545; }
        .bottleneck-medium { border-left: 4px solid #ffc107; }
        .bottleneck-low { border-left: 4px solid #28a745; }

        .footer {
            background: #414042;
            color: white;
            padding: 15px 0;
            text-align: center;
            margin-top: 30px;
        }

        .footer p {
            font-size: 11px;
            margin-bottom: 3px;
        }

        .footer .brand-name {
            color: #0098c2;
            font-weight: 600;
        }

        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: 10px;
                text-align: center;
            }

            .executive-content,
            .two-column,
            .three-column {
                grid-template-columns: 1fr;
            }

            .metrics-grid {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }

            .performance-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>"""
    
    def _generate_enhanced_header(self, project_info):
        """Generate enhanced header with analysis metadata"""
        current_date = datetime.now().strftime("%B %Y")
        analysis_id = f"OPTQO-{datetime.now().strftime('%Y%m%d')}-{hash(project_info['project_name']) % 1000:03d}"
        
        return f"""
    <div class="header">
        <div class="container">
            <div class="header-content">
                <div class="brand">
                    <div class="logo">Q</div>
                    <div class="brand-text">
                        <h1>optqo Platform</h1>
                        <p>Intelligent Assessment with Advanced AI</p>
                    </div>
                </div>
                <div class="report-info">
                    <p>Generated: {current_date}</p>
                    <p>Analysis ID: {analysis_id}</p>
                    <p>Report Type: Enhanced Comprehensive</p>
                </div>
            </div>
        </div>
    </div>"""
    
    def _generate_enhanced_report_title(self, project_info):
        """Generate enhanced report title with technology context"""
        project_name = html.escape(project_info['project_name'])
        
        # Get primary technology from detailed analysis
        tech_details = project_info.get('technology_details', {})
        primary_tech = tech_details.get('primary_technology', 'Unknown')
        
        # Get business purpose from business assessment
        business_details = project_info.get('business_details', {})
        business_purpose = business_details.get('discovered_business_purpose', 'Software system')
        
        return f"""
        <div class="report-title">
            <h2>{project_name} - Comprehensive Codebase Analysis</h2>
            <p>Professional assessment of {primary_tech}-based {business_purpose} including architecture, quality, performance, and strategic recommendations</p>
        </div>"""
    
    def _generate_enhanced_executive_summary(self, project_info):
        """Generate comprehensive executive summary with status indicators"""
        
        # Extract data from multiple sources
        quality_details = project_info.get('quality_details', {})
        business_details = project_info.get('business_details', {})
        executive_summary = project_info.get('executive_summary', {})
        
        overall_quality_score = quality_details.get('overall_quality_score', 50)
        business_purpose = business_details.get('discovered_business_purpose', 'Software system')
        business_scale = business_details.get('business_scale_assessment', {}).get('estimated_scale', 'medium')
        criticality = business_details.get('business_criticality', {}).get('criticality_level', 'MEDIUM')
        
        # Generate status indicators based on analysis
        status_indicators = self._generate_status_indicators(project_info)
        
        # Generate key metrics
        agent1_data = project_info.get('agent1_data', {})
        project_overview = agent1_data.get('project_overview', {})
        
        total_files = project_overview.get('total_files', 0)
        total_chars = project_overview.get('total_size_chars', 0)
        
        tech_details = project_info.get('technology_details', {})
        tech_count = len(tech_details.get('secondary_technologies', []))
        
        # Business value estimate
        financial_assessment = business_details.get('financial_assessment', {})
        business_value = financial_assessment.get('estimated_operational_cost_savings', 'Not estimated')
        
        return f"""
        <div class="section">
            <h3>Executive Summary</h3>
            
            <div class="executive-content">
                <div>
                    <p style="margin-bottom: 15px;">The analyzed system is a <strong>{business_purpose}</strong> with an overall quality score of <strong>{overall_quality_score}%</strong>. The system demonstrates <strong>{business_scale}-scale</strong> architecture and processing capabilities with <strong>{criticality}</strong> business criticality.</p>
                    
                    <p style="margin-bottom: 15px;"><strong>Key Business Impact:</strong> {self._get_business_impact_summary(project_info)}</p>
                    
                    <p><strong>Strategic Assessment:</strong> {executive_summary.get('overall_assessment', 'Comprehensive analysis reveals both strengths and improvement opportunities for enhanced operational efficiency.')}</p>
                </div>
                
                <div class="status-explanation">
                    <h4 style="margin-bottom: 10px;">System Status Indicators</h4>
                    {status_indicators}
                </div>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">{total_files}</div>
                    <div class="metric-label">Total Files</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{tech_count + 1}</div>
                    <div class="metric-label">Technologies</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{overall_quality_score}%</div>
                    <div class="metric-label">Quality Score</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self._format_large_number(total_chars)}</div>
                    <div class="metric-label">Characters of Code</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{criticality}</div>
                    <div class="metric-label">Business Criticality</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{business_value.split()[0] if business_value != 'Not estimated' else 'High'}</div>
                    <div class="metric-label">Est. Annual Value</div>
                </div>
            </div>
        </div>"""
    
    def _generate_status_indicators(self, project_info):
        """Generate status indicators based on analysis results"""
        
        quality_details = project_info.get('quality_details', {})
        performance_details = project_info.get('performance_details', {})
        
        # Determine statuses based on scores
        overall_quality = quality_details.get('overall_quality_score', 50)
        performance_score = performance_details.get('performance_assessment', {}).get('overall_performance_score', 50)
        
        functionality_score = quality_details.get('quality_scores', {}).get('functionality', {}).get('score', 50)
        documentation_score = quality_details.get('quality_scores', {}).get('documentation', {}).get('score', 50)
        
        status_items = []
        
        # Production readiness
        if functionality_score >= 70:
            status_items.append("""
                <div class="status-item">
                    <div class="status-badge status-success">Production Ready</div>
                    <span style="font-size: 11px;">Core functionality operational and stable</span>
                </div>""")
        elif functionality_score >= 50:
            status_items.append("""
                <div class="status-item">
                    <div class="status-badge status-warning">Needs Testing</div>
                    <span style="font-size: 11px;">Functionality present but requires validation</span>
                </div>""")
        else:
            status_items.append("""
                <div class="status-item">
                    <div class="status-badge status-danger">Development</div>
                    <span style="font-size: 11px;">Core functionality needs improvement</span>
                </div>""")
        
        # Performance status
        if performance_score >= 70:
            status_items.append("""
                <div class="status-item">
                    <div class="status-badge status-success">Optimized</div>
                    <span style="font-size: 11px;">Performance meets operational requirements</span>
                </div>""")
        else:
            status_items.append("""
                <div class="status-item">
                    <div class="status-badge status-warning">Needs Optimization</div>
                    <span style="font-size: 11px;">Performance bottlenecks identified in processing</span>
                </div>""")
        
        # Documentation status
        if documentation_score >= 60:
            status_items.append("""
                <div class="status-item">
                    <div class="status-badge status-success">Well Documented</div>
                    <span style="font-size: 11px;">Adequate documentation for maintenance</span>
                </div>""")
        else:
            status_items.append("""
                <div class="status-item">
                    <div class="status-badge status-danger">Documentation Required</div>
                    <span style="font-size: 11px;">Critical lack of documentation poses operational risk</span>
                </div>""")
        
        return "".join(status_items)
    
    def _get_business_impact_summary(self, project_info):
        """Generate business impact summary from business analysis"""
        
        business_details = project_info.get('business_details', {})
        operational_metrics = business_details.get('business_scale_assessment', {}).get('operational_metrics', {})
        
        transactions = operational_metrics.get('estimated_daily_transactions', 'Unknown volume')
        users = operational_metrics.get('estimated_user_capacity', 'Unknown users')
        
        return f"System processes {transactions} with capacity for {users}, providing critical operational capabilities for business continuity."
    
    def _generate_comprehensive_technology_stack(self, project_info):
        """Generate detailed technology stack analysis"""
        
        tech_details = project_info.get('technology_details', {})
        primary_tech = tech_details.get('primary_technology', 'Unknown')
        secondary_techs = tech_details.get('secondary_technologies', [])
        frameworks = tech_details.get('detected_frameworks', [])
        
        # Technology icons mapping
        tech_icons = {
            'PYTHON': '🐍', 'JAVASCRIPT': '🟨', 'SQL': '🗄️', 'JAVA': '☕',
            'HTML': '🌐', 'CSS': '🎨', 'SAS': '📊', 'R': '📈',
            'TEXT': '📄', 'MARKDOWN': '📝', 'JSON': '🔧', 'YAML': '⚙️'
        }
        
        # Get file data from agent1
        agent1_data = project_info.get('agent1_data', {})
        file_catalog = agent1_data.get('file_catalog', {})
        files_by_type = file_catalog.get('files_by_type', {})
        
        # Generate technology items
        tech_items = ""
        
        # Primary technology
        primary_icon = tech_icons.get(primary_tech, '📁')
        primary_count = len(files_by_type.get(primary_tech, []))
        
        tech_items += f"""
            <div class="tech-item" style="border: 2px solid #0098c2;">
                <div class="tech-icon">{primary_icon}</div>
                <div class="tech-name">{primary_tech} (Primary)</div>
                <div style="font-size: 10px; color: #919396;">{primary_count} files</div>
            </div>"""
        
        # Secondary technologies
        for tech in secondary_techs:
            icon = tech_icons.get(tech, '📁')
            file_count = len(files_by_type.get(tech, []))
            
            tech_items += f"""
                <div class="tech-item">
                    <div class="tech-icon">{icon}</div>
                    <div class="tech-name">{tech}</div>
                    <div style="font-size: 10px; color: #919396;">{file_count} files</div>
                </div>"""
        
        # Technology assessment
        tech_assessment = tech_details.get('technology_assessment', {})
        
        return f"""
        <div class="section">
            <h3>Technology Stack Analysis</h3>
            
            <div class="two-column">
                <div>
                    <h4>Detected Technologies</h4>
                    <p>Primary Technology: <strong>{primary_tech}</strong></p>
                    <div class="tech-grid">
                        {tech_items}
                    </div>
                </div>
                
                <div>
                    <h4>Technology Assessment</h4>
                    <h5>Stack Coherence: {tech_assessment.get('stack_coherence', 'N/A')}%</h5>
                    <div class="quality-bar">
                        <div class="quality-fill quality-good" style="width: {tech_assessment.get('stack_coherence', 50)}%;"></div>
                    </div>
                    
                    <h5>Integration Quality: {tech_assessment.get('integration_quality', 'N/A')}%</h5>
                    <div class="quality-bar">
                        <div class="quality-fill quality-good" style="width: {tech_assessment.get('integration_quality', 50)}%;"></div>
                    </div>
                    
                    <h5>Modernity Score: {tech_assessment.get('modernity_score', 'N/A')}%</h5>
                    <div class="quality-bar">
                        <div class="quality-fill quality-average" style="width: {tech_assessment.get('modernity_score', 50)}%;"></div>
                    </div>
                </div>
            </div>
            
            {self._generate_frameworks_section(frameworks)}
        </div>"""
    
    def _generate_frameworks_section(self, frameworks):
        """Generate frameworks and libraries section"""
        
        if not frameworks:
            return ""
        
        frameworks_html = ""
        for framework in frameworks[:6]:  # Limit to top 6
            name = framework.get('name', 'Unknown')
            purpose = framework.get('purpose', 'No description')
            files = framework.get('files', [])
            
            frameworks_html += f"""
                <div class="performance-card">
                    <h5>{html.escape(name)}</h5>
                    <p style="font-size: 12px; color: #666; margin-bottom: 8px;">{html.escape(purpose)}</p>
                    <p style="font-size: 11px; color: #919396;">Used in {len(files)} file(s)</p>
                </div>"""
        
        return f"""
            <h4 style="margin-top: 20px;">Detected Frameworks & Libraries</h4>
            <div class="performance-grid">
                {frameworks_html}
            </div>"""
    
    def _generate_detailed_quality_dashboard(self, project_info):
        """Generate comprehensive quality assessment dashboard"""
        
        quality_details = project_info.get('quality_details', {})
        quality_scores = quality_details.get('quality_scores', {})
        overall_score = quality_details.get('overall_quality_score', 50)
        critical_issues = quality_details.get('critical_issues', [])
        
        # Generate quality bars for each dimension
        quality_bars = ""
        dimension_names = {
            'functionality': 'Functionality',
            'code_organization': 'Code Organization', 
            'documentation': 'Documentation',
            'best_practices': 'Best Practices',
            'error_handling': 'Error Handling',
            'performance': 'Performance'
        }
        
        for dimension_key, dimension_name in dimension_names.items():
            dimension_data = quality_scores.get(dimension_key, {})
            score = dimension_data.get('score', 50)
            reasoning = dimension_data.get('reasoning', 'No assessment available')
            
            # Determine quality level and color
            if score >= 80:
                quality_class = "quality-excellent"
                quality_label = "Excellent"
            elif score >= 65:
                quality_class = "quality-good"
                quality_label = "Good"
            elif score >= 50:
                quality_class = "quality-average"
                quality_label = "Average"
            else:
                quality_class = "quality-poor"
                quality_label = "Needs Improvement"
            
            quality_bars += f"""
            <h5>{dimension_name}</h5>
            <div class="quality-bar">
                <div class="quality-fill {quality_class}" style="width: {score}%;"></div>
            </div>
            <p style="font-size: 11px; color: #919396; margin-bottom: 15px;">{score}% - {quality_label}: {reasoning[:120]}{'...' if len(reasoning) > 120 else ''}</p>
            """
        
        # Generate critical issues
        critical_issues_html = ""
        for issue in critical_issues[:5]:  # Top 5 issues
            impact = issue.get('impact', 'MEDIUM')
            issue_text = issue.get('issue', 'No description')
            business_risk = issue.get('business_risk', 'No risk assessment')
            
            impact_class = {
                'HIGH': 'status-danger',
                'MEDIUM': 'status-warning', 
                'LOW': 'status-success'
            }.get(impact, 'status-warning')
            
            critical_issues_html += f"""
                <div class="bottleneck-card bottleneck-{impact.lower()}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <strong style="font-size: 12px;">{html.escape(issue_text[:80])}{'...' if len(issue_text) > 80 else ''}</strong>
                        <span class="status-badge {impact_class}">{impact}</span>
                    </div>
                    <p style="font-size: 11px; color: #666;">{html.escape(business_risk[:150])}{'...' if len(business_risk) > 150 else ''}</p>
                </div>"""
        
        return f"""
        <div class="section">
            <h3>Code Quality Assessment</h3>
            
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 25px; margin-bottom: 20px;">
                <div>
                    <h4>Overall Quality Score: {overall_score}%</h4>
                    <div class="quality-bar" style="height: 12px;">
                        <div class="quality-fill {'quality-excellent' if overall_score >= 80 else 'quality-good' if overall_score >= 65 else 'quality-average' if overall_score >= 50 else 'quality-poor'}" style="width: {overall_score}%;"></div>
                    </div>
                </div>
                <div style="text-align: center;">
                    <div class="metric-value" style="font-size: 48px; margin-bottom: 0;">{overall_score}</div>
                    <div class="metric-label">QUALITY SCORE</div>
                </div>
            </div>
            
            <div class="two-column">
                <div>
                    <h4>Quality Dimensions</h4>
                    {quality_bars}
                </div>
                
                <div>
                    <h4>Critical Quality Issues</h4>
                    {critical_issues_html if critical_issues_html else '<p style="color: #28a745; font-style: italic;">No critical issues identified</p>'}
                </div>
            </div>
        </div>"""
    
    def _generate_system_architecture_analysis(self, project_info):
        """Generate comprehensive system architecture analysis"""
        
        architecture_details = project_info.get('architecture_details', {})
        system_architecture = architecture_details.get('system_architecture', {})
        data_flow_analysis = architecture_details.get('data_flow_analysis', {})
        system_components = architecture_details.get('system_components', [])
        strengths = architecture_details.get('architectural_strengths', [])
        concerns = architecture_details.get('architectural_concerns', [])
        
        primary_pattern = system_architecture.get('primary_pattern', 'Unknown').replace('_', ' ')
        architecture_score = system_architecture.get('architecture_score', 50)
        
        # Generate data flow diagram
        data_flow_html = self._generate_data_flow_diagram(data_flow_analysis)
        
        # Generate system components
        components_html = ""
        for component in system_components[:6]:  # Top 6 components
            name = component.get('component', 'Unknown')
            responsibility = component.get('responsibility', 'No description')
            criticality = component.get('criticality', 'MEDIUM')
            dependencies = component.get('dependencies', [])
            
            criticality_class = {
                'HIGH': 'status-danger',
                'MEDIUM': 'status-warning',
                'LOW': 'status-success'
            }.get(criticality, 'status-warning')
            
            components_html += f"""
                <div class="performance-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h5 style="margin: 0;">{html.escape(name)}</h5>
                        <span class="status-badge {criticality_class}">{criticality}</span>
                    </div>
                    <p style="font-size: 12px; color: #666; margin-bottom: 8px;">{html.escape(responsibility)}</p>
                    <p style="font-size: 11px; color: #919396;">Dependencies: {len(dependencies)}</p>
                </div>"""
        
        return f"""
        <div class="section">
            <h3>System Architecture Analysis</h3>
            
            <div class="two-column">
                <div>
                    <h4>Architecture Overview</h4>
                    <h5>Primary Pattern: {primary_pattern}</h5>
                    <h5>Architecture Score: {architecture_score}%</h5>
                    <div class="quality-bar">
                        <div class="quality-fill {'quality-excellent' if architecture_score >= 80 else 'quality-good' if architecture_score >= 65 else 'quality-average' if architecture_score >= 50 else 'quality-poor'}" style="width: {architecture_score}%;"></div>
                    </div>
                    
                    {data_flow_html}
                </div>
                
                <div>
                    <h4>Architecture Assessment</h4>
                    
                    <h5 style="color: #28a745;">Architectural Strengths</h5>
                    <ul style="margin-left: 20px; margin-bottom: 15px;">
                        {self._generate_list_items(strengths[:4], color='#28a745')}
                    </ul>
                    
                    <h5 style="color: #dc3545;">Areas of Concern</h5>
                    <ul style="margin-left: 20px;">
                        {self._generate_list_items(concerns[:4], color='#dc3545')}
                    </ul>
                </div>
            </div>
            
            <h4 style="margin-top: 25px;">System Components</h4>
            <div class="performance-grid">
                {components_html}
            </div>
        </div>"""
    
    def _generate_data_flow_diagram(self, data_flow_analysis):
        """Generate data flow diagram"""
        
        processing_stages = data_flow_analysis.get('processing_stages', [])
        
        if not processing_stages:
            return ""
        
        flowchart_html = ""
        for i, stage in enumerate(processing_stages[:6]):  # Limit to 6 stages
            stage_name = stage.get('stage', 'Unknown').replace('_', ' ')
            purpose = stage.get('purpose', 'No description')
            
            flowchart_html += f"""
                <div class="flow-step">{html.escape(stage_name)}<br><span style="font-size: 10px; color: #666;">{html.escape(purpose[:50])}{'...' if len(purpose) > 50 else ''}</span></div>"""
            
            if i < len(processing_stages) - 1:
                flowchart_html += '<div class="flow-arrow">↓</div>'
        
        return f"""
            <h5 style="margin-top: 15px;">Data Processing Flow</h5>
            <div class="flowchart">
                {flowchart_html}
            </div>"""
    
    def _generate_file_analysis_section(self, project_info):
        """Generate comprehensive file analysis table"""
        
        # Get file data from multiple sources
        agent1_data = project_info.get('agent1_data', {})
        file_catalog = agent1_data.get('file_catalog', {})
        all_files = file_catalog.get('all_files', [])
        
        file_structure_details = project_info.get('file_structure_details', {})
        quality_details = project_info.get('quality_details', {})
        
        # Sort files by size to get most significant ones
        sorted_files = sorted(all_files, key=lambda x: x.get('size_chars', 0), reverse=True)[:10]
        
        file_rows = ""
        for i, file_info in enumerate(sorted_files, 1):
            name = file_info.get('name', 'Unknown')
            path = file_info.get('path', '')
            extension = file_info.get('extension', '')
            size_chars = file_info.get('size_chars', 0)
            
            # Determine file status based on extension and size
            status, status_class = self._determine_file_status(extension, size_chars)
            
            # Get file purpose based on name/extension
            purpose = self._determine_file_purpose(name, extension)
            
            # Estimate business impact
            business_impact = self._estimate_file_business_impact(name, extension, size_chars)
            
            file_rows += f"""
                <tr>
                    <td>{i}</td>
                    <td><strong>{html.escape(name)}</strong><br><span style="font-size: 10px; color: #919396;">{html.escape(path)}</span></td>
                    <td>{html.escape(purpose)}</td>
                    <td>{self._format_large_number(size_chars)} chars</td>
                    <td>{html.escape(business_impact)}</td>
                    <td><span class="status-badge {status_class}">{status}</span></td>
                </tr>"""
        
        return f"""
        <div class="section">
            <h3>File Analysis</h3>
            
            <table class="data-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>File Name & Path</th>
                        <th>Purpose</th>
                        <th>Size</th>
                        <th>Business Impact</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {file_rows}
                </tbody>
            </table>
        </div>"""
    
    def _determine_file_status(self, extension, size_chars):
        """Determine file status based on characteristics"""
        
        if extension.lower() in ['.py', '.js', '.java', '.sas']:
            if size_chars > 10000:
                return "Complex", "status-warning"
            elif size_chars > 1000:
                return "Standard", "status-success"
            else:
                return "Simple", "status-success"
        elif extension.lower() in ['.sql']:
            if size_chars > 5000:
                return "Complex Query", "status-warning"
            else:
                return "Standard Query", "status-success"
        elif extension.lower() in ['.txt', '.md']:
            return "Documentation", "status-success"
        else:
            return "Data/Config", "status-success"
    
    def _determine_file_purpose(self, name, extension):
        """Determine file purpose based on name and extension"""
        
        name_lower = name.lower()
        ext_lower = extension.lower()
        
        if 'test' in name_lower:
            return "Testing and validation"
        elif 'config' in name_lower or ext_lower in ['.json', '.yaml', '.yml']:
            return "Configuration management"
        elif ext_lower == '.sql':
            return "Database operations and queries"
        elif ext_lower in ['.py', '.js', '.java']:
            return "Core application logic"
        elif ext_lower == '.sas':
            return "Statistical analysis and data processing"
        elif 'readme' in name_lower or ext_lower == '.md':
            return "Project documentation"
        elif 'report' in name_lower:
            return "Report generation and output"
        else:
            return "Supporting functionality"
    
    def _estimate_file_business_impact(self, name, extension, size_chars):
        """Estimate business impact of file"""
        
        name_lower = name.lower()
        
        if any(word in name_lower for word in ['main', 'core', 'primary', 'engine']):
            return "Critical - core system functionality"
        elif any(word in name_lower for word in ['report', 'output', 'export']):
            return "High - user-facing outputs"
        elif any(word in name_lower for word in ['config', 'setup', 'init']):
            return "High - system configuration"
        elif size_chars > 10000:
            return "Medium - substantial business logic"
        elif any(word in name_lower for word in ['test', 'demo', 'sample']):
            return "Low - testing and validation"
        else:
            return "Medium - supporting functionality"
    
    def _generate_performance_optimization_analysis(self, project_info):
        """Generate comprehensive performance analysis with optimization cards"""
        
        performance_details = project_info.get('performance_details', {})
        performance_assessment = performance_details.get('performance_assessment', {})
        bottleneck_analysis = performance_details.get('bottleneck_analysis', [])
        improvement_opportunities = performance_details.get('improvement_opportunities', [])
        
        overall_score = performance_assessment.get('overall_performance_score', 50)
        performance_characteristics = performance_assessment.get('performance_characteristics', {})
        
        # Generate performance characteristics
        characteristics_html = ""
        for char_name, score in performance_characteristics.items():
            display_name = char_name.replace('_', ' ').title()
            quality_class = 'quality-excellent' if score >= 80 else 'quality-good' if score >= 65 else 'quality-average' if score >= 50 else 'quality-poor'
            
            characteristics_html += f"""
                <h5>{display_name}: {score}%</h5>
                <div class="quality-bar">
                    <div class="quality-fill {quality_class}" style="width: {score}%;"></div>
                </div>"""
        
        # Generate bottlenecks
        bottlenecks_html = ""
        for bottleneck in bottleneck_analysis[:4]:  # Top 4 bottlenecks
            name = bottleneck.get('bottleneck', 'Unknown bottleneck')
            severity = bottleneck.get('severity', 'MEDIUM')
            description = bottleneck.get('description', 'No description')
            impact = bottleneck.get('performance_impact', 'Impact not specified')
            
            severity_class = f"bottleneck-{severity.lower()}"
            
            bottlenecks_html += f"""
                <div class="bottleneck-card {severity_class}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <strong style="font-size: 12px;">{html.escape(name)}</strong>
                        <span class="priority-{severity.lower()}">{severity}</span>
                    </div>
                    <p style="font-size: 11px; color: #666; margin-bottom: 5px;">{html.escape(description)}</p>
                    <p style="font-size: 10px; color: #919396;"><strong>Impact:</strong> {html.escape(impact)}</p>
                </div>"""
        
        # Generate optimization opportunities
        optimizations_html = ""
        for opt in improvement_opportunities[:6]:  # Top 6 opportunities
            optimization = opt.get('optimization', 'Unknown optimization')
            expected_improvement = opt.get('expected_improvement', 'Improvement not specified')
            effort = opt.get('effort_estimate', 'Unknown effort')
            priority = opt.get('priority', 'MEDIUM')
            
            priority_class = f"priority-{priority.lower()}"
            
            optimizations_html += f"""
                <div class="performance-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h5 style="margin: 0; font-size: 13px;">{html.escape(optimization[:40])}{'...' if len(optimization) > 40 else ''}</h5>
                        <span class="{priority_class}">{priority}</span>
                    </div>
                    <p style="font-size: 11px; color: #666; margin-bottom: 5px;"><strong>Impact:</strong> {html.escape(expected_improvement[:60])}{'...' if len(expected_improvement) > 60 else ''}</p>
                    <p style="font-size: 10px; color: #919396;"><strong>Effort:</strong> {html.escape(effort)}</p>
                </div>"""
        
        return f"""
        <div class="section">
            <h3>Performance & Optimization Analysis</h3>
            
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 25px; margin-bottom: 20px;">
                <div>
                    <h4>Overall Performance Score: {overall_score}%</h4>
                    <div class="quality-bar" style="height: 12px;">
                        <div class="quality-fill {'quality-excellent' if overall_score >= 80 else 'quality-good' if overall_score >= 65 else 'quality-average' if overall_score >= 50 else 'quality-poor'}" style="width: {overall_score}%;"></div>
                    </div>
                </div>
                <div style="text-align: center;">
                    <div class="metric-value" style="font-size: 48px; margin-bottom: 0;">{overall_score}</div>
                    <div class="metric-label">PERFORMANCE SCORE</div>
                </div>
            </div>
            
            <div class="three-column">
                <div>
                    <h4>Performance Characteristics</h4>
                    {characteristics_html}
                </div>
                
                <div>
                    <h4>Performance Bottlenecks</h4>
                    {bottlenecks_html if bottlenecks_html else '<p style="color: #28a745; font-style: italic;">No major bottlenecks identified</p>'}
                </div>
                
                <div>
                    <h4>Capacity & Scalability</h4>
                    {self._generate_capacity_info(performance_details)}
                </div>
            </div>
            
            <h4 style="margin-top: 25px;">Optimization Opportunities</h4>
            <div class="performance-grid">
                {optimizations_html}
            </div>
        </div>"""
    
    def _generate_capacity_info(self, performance_details):
        """Generate capacity and scalability information"""
        
        scalability_analysis = performance_details.get('scalability_analysis', {})
        capacity_planning = performance_details.get('capacity_planning', {})
        
        throughput = scalability_analysis.get('current_throughput_estimate', 'Not estimated')
        capacity_estimate = capacity_planning.get('current_capacity_estimate', 'Not assessed')
        growth_projections = capacity_planning.get('growth_projections', 'No projections available')
        
        return f"""
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <h5 style="color: #0098c2; margin-bottom: 8px;">Current Throughput</h5>
                <p style="font-size: 11px; margin-bottom: 10px;">{html.escape(throughput)}</p>
                
                <h5 style="color: #0098c2; margin-bottom: 8px;">Capacity Status</h5>
                <p style="font-size: 11px; margin-bottom: 10px;">{html.escape(capacity_estimate)}</p>
                
                <h5 style="color: #0098c2; margin-bottom: 8px;">Growth Outlook</h5>
                <p style="font-size: 11px;">{html.escape(growth_projections[:100])}{'...' if len(growth_projections) > 100 else ''}</p>
            </div>"""
    
    def _generate_comprehensive_recommendations(self, project_info):
        """Generate comprehensive strategic recommendations table"""
        
        strategic_recommendations = project_info.get('strategic_recommendations', [])
        
        if not strategic_recommendations:
            return """
        <div class="section">
            <h3>Strategic Recommendations</h3>
            <p>No specific strategic recommendations were generated based on the analysis.</p>
        </div>"""
        
        recommendations_table = """
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Priority</th>
                        <th>Category</th>
                        <th>Recommendation</th>
                        <th>Business Impact</th>
                        <th>Effort</th>
                        <th>ROI Estimate</th>
                    </tr>
                </thead>
                <tbody>"""
        
        for rec in strategic_recommendations:
            priority = rec.get('priority', 'MEDIUM')
            category = rec.get('category', 'General').replace('_', ' ').title()
            action = rec.get('action', 'No action specified')
            business_justification = rec.get('business_justification', rec.get('impact', 'No impact specified'))
            effort = rec.get('effort', 'Unknown')
            roi_estimate = rec.get('roi_estimate', 'Not calculated')
            
            priority_class = f"priority-{priority.lower()}"
            
            recommendations_table += f"""
                    <tr>
                        <td><span class="{priority_class}">{priority}</span></td>
                        <td><strong>{html.escape(category)}</strong></td>
                        <td>{html.escape(action[:100])}{'...' if len(action) > 100 else ''}</td>
                        <td>{html.escape(business_justification[:120])}{'...' if len(business_justification) > 120 else ''}</td>
                        <td>{html.escape(effort)}</td>
                        <td>{html.escape(roi_estimate)}</td>
                    </tr>"""
        
        recommendations_table += """
                </tbody>
            </table>"""
        
        return f"""
        <div class="section">
            <h3>Strategic Recommendations</h3>
            <p style="margin-bottom: 15px;">Prioritized recommendations based on comprehensive analysis of technology, quality, architecture, performance, and business factors.</p>
            {recommendations_table}
        </div>"""
    
    def _generate_list_items(self, items, color='#666'):
        """Generate HTML list items with consistent styling"""
        
        if not items:
            return '<li style="color: #919396; font-style: italic;">None identified</li>'
        
        html_items = ""
        for item in items:
            html_items += f'<li style="color: {color}; font-size: 12px; margin-bottom: 5px;">{html.escape(str(item))}</li>'
        
        return html_items
    
    def _generate_enhanced_footer(self):
        """Generate enhanced footer with additional information"""
        current_year = datetime.now().year
        
        return f"""
    <div class="footer">
        <p>Generated by <span class="brand-name">optqo Platform</span> - Intelligent Assessment with Advanced AI</p>
        <p>© {current_year} optqo. All rights reserved. | Enhanced Comprehensive Analysis Report</p>
        <p style="margin-top: 5px; font-size: 10px;">This report provides strategic insights for technology decision-making and operational optimization.</p>
    </div>"""
    
    def _format_large_number(self, number):
        """Format large numbers with K/M suffixes"""
        if number > 1000000:
            return f"{number/1000000:.1f}M"
        elif number > 1000:
            return f"{number/1000:.1f}K"
        else:
            return str(number)
    
    def _save_html_report(self, html_content, project_name):
        """Save the enhanced HTML report to file"""
        
        # Clean project name for filename
        clean_name = "".join(c for c in project_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        clean_name = clean_name.replace(' ', '_')
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"optqo_enhanced_report_{clean_name}_{timestamp}.html"
        
        report_path = self.reports_dir / filename
        
        try:
            with open(report_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            print(f"✅ Enhanced report saved to: {report_path}")
            return report_path
            
        except Exception as e:
            print(f"❌ Failed to save enhanced report: {e}")
            raise


# Test function for enhanced agent
def test_enhanced_report_generation(agent1_output, agent2_output):
    """Test the enhanced report generation agent"""
    agent = EnhancedReportGenerationAgent()
    
    try:
        result = agent.generate_report(agent1_output, agent2_output)
        
        print("\n📊 ENHANCED REPORT GENERATION RESULTS")
        print("=" * 60)
        print(f"Report saved to: {result['report_path']}")
        print(f"Project: {result['project_name']}")
        print(f"Report Type: {result['report_type']}")
        
        return result
        
    except Exception as e:
        print(f"❌ Enhanced Report Generation Error: {e}")
        return None