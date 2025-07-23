import json
from pathlib import Path
from datetime import datetime
import html

class ReportGenerationAgent:
    def __init__(self, log_dir="log"):
        # Setup logging
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = self.log_dir / f"agent3_report_{timestamp}.json"
        
        self.log_file = log_file
        self.analysis_log = {
            "timestamp": timestamp,
            "agent": "report_generation_agent",
            "analysis_steps": [],
            "final_result": None
        }
        
        print(f"📝 Agent 3 logging to: {log_file}")
        
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
        print(f"🔄 {step_name}: {description}")
    
    def _save_log(self):
        """Save the analysis log to file"""
        try:
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump(self.analysis_log, f, indent=2, default=str)
            print(f"💾 Agent 3 log saved to: {self.log_file}")
        except Exception as e:
            print(f"⚠️ Failed to save Agent 3 log: {e}")
    
    def generate_report(self, agent1_output, agent2_output):
        """Generate professional HTML report from analysis results"""
        try:
            self._log_step("INIT", "Starting professional report generation")
            
            # Extract key information
            project_info = self._extract_project_info(agent1_output, agent2_output)
            
            # Generate HTML content
            self._log_step("HTML_GENERATION", "Generating HTML content")
            html_content = self._generate_html_report(project_info)
            
            # Save report
            self._log_step("SAVE_REPORT", "Saving HTML report")
            report_path = self._save_html_report(html_content, project_info['project_name'])
            
            result = {
                'report_path': str(report_path),
                'project_name': project_info['project_name'],
                'generation_timestamp': datetime.now().isoformat()
            }
            
            self.analysis_log["final_result"] = result
            self._log_step("COMPLETE", f"Report generated: {report_path}")
            self._save_log()
            
            return result
            
        except Exception as e:
            self._log_step("ERROR", f"Report generation failed: {str(e)}")
            self.analysis_log["error"] = str(e)
            self._save_log()
            raise
    
    def _extract_project_info(self, agent1_output, agent2_output):
        """Extract and organize information for report generation"""
        
        project_overview = agent1_output.get('project_overview', {})
        tech_stack = agent1_output.get('technology_stack', {})
        quality_assessment = agent2_output.get('quality_assessment', {})
        architecture_analysis = agent2_output.get('architecture_analysis', {})
        business_assessment = agent2_output.get('business_assessment', {})
        recommendations = agent2_output.get('strategic_recommendations', [])
        
        return {
            'project_name': project_overview.get('name', 'Unknown Project'),
            'project_overview': project_overview,
            'technology_stack': tech_stack,
            'quality_assessment': quality_assessment,
            'architecture_analysis': architecture_analysis,
            'business_assessment': business_assessment,
            'recommendations': recommendations,
            'analysis_metadata': agent2_output.get('analysis_metadata', {})
        }
    
    def _generate_html_report(self, project_info):
        """Generate the complete HTML report"""
        
        # Generate each section
        executive_summary = self._generate_executive_summary(project_info)
        technology_stack_section = self._generate_technology_stack(project_info)
        quality_dashboard = self._generate_quality_dashboard(project_info)
        architecture_section = self._generate_architecture_analysis(project_info)
        recommendations_section = self._generate_recommendations(project_info)
        
        # Combine into full HTML
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>optqo Platform - {html.escape(project_info['project_name'])} Analysis Report</title>
    {self._get_css_styles()}
</head>
<body>
    {self._generate_header(project_info)}
    
    <div class="container">
        {self._generate_report_title(project_info)}
        {executive_summary}
        {technology_stack_section}
        {quality_dashboard}
        {architecture_section}
        {recommendations_section}
    </div>
    
    {self._generate_footer()}
</body>
</html>"""
        
        return html_content
    
    def _get_css_styles(self):
        """Return the complete CSS styling for the report"""
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
            height: 6px;
            border-radius: 3px;
            overflow: hidden;
            margin: 5px 0;
        }

        .quality-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.3s ease;
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

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 13px;
        }

        .data-table th,
        .data-table td {
            padding: 10px;
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
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
        }

        .priority-medium {
            background: #fff3cd;
            color: #856404;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
        }

        .priority-low {
            background: #d4edda;
            color: #155724;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
        }

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

            .metrics-grid {
                grid-template-columns: 1fr;
            }

            .data-table {
                font-size: 11px;
            }
        }
    </style>"""
    
    def _generate_header(self, project_info):
        """Generate the header section"""
        current_date = datetime.now().strftime("%B %Y")
        analysis_id = f"OPTQO-{datetime.now().strftime('%Y%m%d')}-001"
        
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
                </div>
            </div>
        </div>
    </div>"""
    
    def _generate_report_title(self, project_info):
        """Generate the report title section"""
        project_name = html.escape(project_info['project_name'])
        primary_tech = project_info['technology_stack'].get('primary_technology', 'Unknown')
        
        return f"""
        <div class="report-title">
            <h2>{project_name} - Codebase Analysis Report</h2>
            <p>Comprehensive assessment of {primary_tech}-based system architecture, quality, and business impact</p>
        </div>"""
    
    def _generate_executive_summary(self, project_info):
        """Generate the executive summary section"""
        
        quality_score = project_info['quality_assessment'].get('overall_quality_score', 50)
        business_purpose = project_info['business_assessment'].get('discovered_business_purpose', 'Software system')
        business_scale = project_info['business_assessment'].get('estimated_business_scale', 'medium')
        
        # Generate key metrics
        total_files = project_info['project_overview'].get('total_files', 0)
        total_chars = project_info['project_overview'].get('total_size_chars', 0)
        tech_count = project_info['technology_stack'].get('technology_count', 0)
        
        return f"""
        <div class="section">
            <h3>Executive Summary</h3>
            
            <p style="margin-bottom: 15px;">The analyzed system is a <strong>{business_purpose}</strong> with an overall quality score of <strong>{quality_score}%</strong>. The system demonstrates {business_scale}-scale architecture and processing capabilities.</p>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">{total_files}</div>
                    <div class="metric-label">Total Files</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{tech_count}</div>
                    <div class="metric-label">Technologies</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{quality_score}%</div>
                    <div class="metric-label">Quality Score</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self._format_large_number(total_chars)}</div>
                    <div class="metric-label">Lines of Code</div>
                </div>
            </div>
        </div>"""
    
    def _generate_technology_stack(self, project_info):
        """Generate the technology stack section"""
        
        tech_stack = project_info['technology_stack']
        primary_tech = tech_stack.get('primary_technology', 'Unknown')
        all_techs = tech_stack.get('all_technologies', {})
        
        tech_icons = {
            'PYTHON': '🐍', 'JAVASCRIPT': '🟨', 'SQL': '🗄️', 'JAVA': '☕',
            'HTML': '🌐', 'CSS': '🎨', 'SAS': '📊', 'R': '📈',
            'TEXT': '📄', 'MARKDOWN': '📝', 'JSON': '🔧', 'YAML': '⚙️'
        }
        
        tech_items = ""
        for tech, data in all_techs.items():
            icon = tech_icons.get(tech, '📁')
            file_count = data.get('file_count', 0)
            
            tech_items += f"""
                <div class="tech-item">
                    <div class="tech-icon">{icon}</div>
                    <div class="tech-name">{tech}</div>
                    <div style="font-size: 10px; color: #919396;">{file_count} files</div>
                </div>"""
        
        return f"""
        <div class="section">
            <h3>Technology Stack</h3>
            <p>Primary Technology: <strong>{primary_tech}</strong></p>
            <div class="tech-grid">
                {tech_items}
            </div>
        </div>"""
    
    def _generate_quality_dashboard(self, project_info):
        """Generate the quality assessment dashboard"""
        
        quality_assessment = project_info['quality_assessment']
        dimensional_scores = quality_assessment.get('dimensional_scores', {})
        
        quality_bars = ""
        for dimension, score_data in dimensional_scores.items():
            score = score_data.get('score', 50)
            reasoning = score_data.get('reasoning', 'No assessment available')
            
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
            <h4>{dimension.replace('_', ' ').title()}</h4>
            <div class="quality-bar">
                <div class="quality-fill {quality_class}" style="width: {score}%;"></div>
            </div>
            <p style="font-size: 11px; color: #919396; margin-bottom: 15px;">{score}% - {quality_label}: {reasoning[:100]}...</p>
            """
        
        return f"""
        <div class="section">
            <h3>Code Quality Assessment</h3>
            {quality_bars}
        </div>"""
    
    def _generate_architecture_analysis(self, project_info):
        """Generate the architecture analysis section"""
        
        architecture = project_info['architecture_analysis']
        system_pattern = architecture.get('system_pattern', 'Unknown')
        strengths = architecture.get('architecture_strengths', [])
        concerns = architecture.get('architecture_concerns', [])
        
        strengths_list = ""
        for strength in strengths[:5]:
            strengths_list += f"<li>{html.escape(str(strength))}</li>"
        
        concerns_list = ""
        for concern in concerns[:5]:
            concerns_list += f"<li>{html.escape(str(concern))}</li>"
        
        return f"""
        <div class="section">
            <h3>Architecture Analysis</h3>
            
            <h4>System Pattern</h4>
            <p><strong>{system_pattern.replace('_', ' ')}</strong></p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-top: 20px;">
                <div>
                    <h4>Architectural Strengths</h4>
                    <ul style="margin-left: 20px; color: #28a745;">
                        {strengths_list}
                    </ul>
                </div>
                
                <div>
                    <h4>Areas of Concern</h4>
                    <ul style="margin-left: 20px; color: #dc3545;">
                        {concerns_list}
                    </ul>
                </div>
            </div>
        </div>"""
    
    def _generate_recommendations(self, project_info):
        """Generate the strategic recommendations section"""
        
        recommendations = project_info['recommendations'][:10]  # Top 10
        
        if not recommendations:
            return """
        <div class="section">
            <h3>Strategic Recommendations</h3>
            <p>No specific recommendations generated. System appears to be functioning well.</p>
        </div>"""
        
        recommendations_table = """
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Priority</th>
                        <th>Recommendation</th>
                        <th>Business Impact</th>
                        <th>Effort</th>
                    </tr>
                </thead>
                <tbody>"""
        
        for rec in recommendations:
            priority = rec.get('priority', 'MEDIUM')
            recommendation = html.escape(rec.get('action', rec.get('recommendation', 'No description')))[:100]
            business_impact = html.escape(rec.get('impact', rec.get('business_justification', 'No impact specified')))[:100]
            effort = rec.get('effort', rec.get('effort_estimate', 'Unknown'))
            
            priority_class = f"priority-{priority.lower()}"
            
            recommendations_table += f"""
                    <tr>
                        <td><span class="{priority_class}">{priority}</span></td>
                        <td>{recommendation}</td>
                        <td>{business_impact}</td>
                        <td>{effort}</td>
                    </tr>"""
        
        recommendations_table += """
                </tbody>
            </table>"""
        
        return f"""
        <div class="section">
            <h3>Strategic Recommendations</h3>
            {recommendations_table}
        </div>"""
    
    def _generate_footer(self):
        """Generate the footer section"""
        current_year = datetime.now().year
        
        return f"""
    <div class="footer">
        <p>Generated by <span class="brand-name">optqo Platform</span> - Intelligent Assessment with Advanced AI</p>
        <p>© {current_year} optqo. All rights reserved.</p>
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
        """Save the HTML report to file"""
        
        # Clean project name for filename
        clean_name = "".join(c for c in project_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        clean_name = clean_name.replace(' ', '_')
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"optqo_report_{clean_name}_{timestamp}.html"
        
        report_path = self.reports_dir / filename
        
        try:
            with open(report_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            print(f"✅ Report saved to: {report_path}")
            return report_path
            
        except Exception as e:
            print(f"❌ Failed to save report: {e}")
            raise

# Test function
def test_report_generation(agent1_output, agent2_output):
    """Test the report generation agent"""
    agent = ReportGenerationAgent()
    
    try:
        result = agent.generate_report(agent1_output, agent2_output)
        
        print("\n📊 REPORT GENERATION RESULTS")
        print("=" * 50)
        print(f"Report saved to: {result['report_path']}")
        print(f"Project: {result['project_name']}")
        
        return result
        
    except Exception as e:
        print(f"❌ Report Generation Error: {e}")
        return None