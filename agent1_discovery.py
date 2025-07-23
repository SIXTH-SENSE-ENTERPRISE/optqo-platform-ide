import os
import json
from pathlib import Path
from collections import defaultdict
import mimetypes
import logging
from datetime import datetime

class ProjectDiscoveryAgent:
    def __init__(self, log_dir="log"):
        # Technology detection patterns

        # Setup logging
        self.log_dir = Path("/home/rishav/Documents/Code/6th-sense/Optqo_repo_function/log")
        self.log_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = self.log_dir / f"agent1_discovery_{timestamp}.json"
        
        # Setup JSON logging
        self.log_file = log_file
        self.analysis_log = {
            "timestamp": timestamp,
            "agent": "discovery_agent",
            "analysis_steps": [],
            "final_result": None
        }
        
        print(f"📝 Agent 1 logging to: {log_file}")
        self.tech_patterns = {
            # Analytics & Data Science
            'PYTHON': {'.py', '.ipynb', '.pyx'},
            'R': {'.r', '.R', '.rmd', '.Rmd'},
            'SAS': {'.sas', '.sas7bdat'},
            'MATLAB': {'.m', '.mlx', '.mat'},
            'SPSS': {'.sps', '.sav'},
            'STATA': {'.do', '.ado', '.dta'},
            'JULIA': {'.jl'},
            
            # Web & Backend
            'JAVASCRIPT': {'.js', '.jsx', '.ts', '.tsx', '.mjs'},
            'HTML': {'.html', '.htm', '.xhtml'},
            'CSS': {'.css', '.scss', '.sass', '.less'},
            'PHP': {'.php', '.phtml'},
            'JAVA': {'.java', '.class', '.jar'},
            'C#': {'.cs', '.csx'},
            'GO': {'.go'},
            'RUST': {'.rs'},
            
            # Database & Config
            'SQL': {'.sql', '.ddl', '.dml'},
            'JSON': {'.json'},
            'YAML': {'.yaml', '.yml'},
            'XML': {'.xml', '.xsd'},
            'CSV': {'.csv'},
            
            # Shell & Scripts
            'SHELL': {'.sh', '.bash', '.zsh', '.fish'},
            'POWERSHELL': {'.ps1', '.psm1'},
            'BATCH': {'.bat', '.cmd'},
            
            # Documentation
            'MARKDOWN': {'.md', '.markdown', '.mdx'},
            'TEXT': {'.txt', '.log', '.readme'},
            'DOC': {'.doc', '.docx', '.pdf', '.rtf'}
        }
        
        # Project type indicators
        self.project_indicators = {
            'DATA_ANALYTICS': ['data', 'analysis', 'etl', 'pipeline', 'warehouse'],
            'WEB_APPLICATION': ['app', 'web', 'frontend', 'backend', 'api'],
            'MACHINE_LEARNING': ['ml', 'model', 'train', 'predict', 'sklearn'],
            'ENTERPRISE': ['service', 'business', 'domain', 'enterprise'],
            'RESEARCH': ['research', 'experiment', 'study', 'paper']
        }
        
        # Chunking thresholds
        self.chunking_thresholds = {
            'small_project': {'max_files': 20, 'max_chars': 100000},
            'medium_project': {'max_files': 100, 'max_chars': 500000},
            'large_project': {'max_files': float('inf'), 'max_chars': float('inf')}
        }
    
    def analyze_directory(self, directory_path):
        """Main analysis function"""
        directory_path = Path(directory_path)
        
        if not directory_path.exists():
            raise FileNotFoundError(f"Directory not found: {directory_path}")
        
        # Scan all files
        file_catalog = self._scan_files(directory_path)
        
        # Detect technologies
        tech_stack = self._detect_technologies(file_catalog)
        
        # Identify project type
        project_type = self._identify_project_type(directory_path, tech_stack)
        
        # Calculate project metrics
        metrics = self._calculate_metrics(file_catalog)
        
        # Make chunking decision
        chunking_decision = self._decide_chunking(file_catalog, metrics)
        
        # Build result
        result = {
            'project_overview': {
                'name': directory_path.name,
                'path': str(directory_path),
                'total_files': metrics['total_files'],
                'total_size_chars': metrics['total_chars'],
                'directory_depth': metrics['max_depth']
            },
            'file_catalog': file_catalog,
            'technology_stack': tech_stack,
            'project_type': project_type,
            'metrics': metrics,
            'chunking_decision': chunking_decision
        }
        
        return result
    
    def _scan_files(self, directory_path):
        """Recursively scan all files in directory"""
        file_catalog = {
            'structure': {},
            'files_by_type': defaultdict(list),
            'files_by_extension': defaultdict(list),
            'all_files': []
        }
        
        try:
            for root, dirs, files in os.walk(directory_path):
                # Skip common ignore patterns
                dirs[:] = [d for d in dirs if not d.startswith('.') and d not in {'__pycache__', 'node_modules', '.git'}]
                
                rel_root = Path(root).relative_to(directory_path)
                
                for file in files:
                    if file.startswith('.'):
                        continue
                        
                    file_path = Path(root) / file
                    rel_file_path = rel_root / file
                    
                    # Get file info
                    try:
                        file_size = file_path.stat().st_size
                        file_ext = file_path.suffix.lower()
                        
                        file_info = {
                            'name': file,
                            'path': str(rel_file_path),
                            'absolute_path': str(file_path),
                            'extension': file_ext,
                            'size_bytes': file_size,
                            'directory': str(rel_root) if str(rel_root) != '.' else 'root'
                        }
                        
                        # Try to get character count for text files
                        try:
                            if self._is_text_file(file_path):
                                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                    content = f.read()
                                    file_info['size_chars'] = len(content)
                                    file_info['is_text'] = True
                            else:
                                file_info['size_chars'] = 0
                                file_info['is_text'] = False
                        except:
                            file_info['size_chars'] = 0
                            file_info['is_text'] = False
                        
                        file_catalog['all_files'].append(file_info)
                        file_catalog['files_by_extension'][file_ext].append(file_info)
                        
                        # Categorize by technology
                        tech_type = self._get_file_tech_type(file_ext)
                        if tech_type:
                            file_catalog['files_by_type'][tech_type].append(file_info)
                            
                    except (OSError, PermissionError):
                        continue
                        
        except Exception as e:
            print(f"Error scanning directory: {e}")
        
        return file_catalog
    
    def _is_text_file(self, file_path):
        """Check if file is likely a text file"""
        try:
            mime_type, _ = mimetypes.guess_type(str(file_path))
            if mime_type and mime_type.startswith('text/'):
                return True
            
            # Check common text extensions
            text_extensions = {'.py', '.js', '.html', '.css', '.md', '.txt', '.json', '.yaml', '.yml', 
                             '.sql', '.r', '.sas', '.m', '.jl', '.go', '.rs', '.java', '.cs', '.php',
                             '.sh', '.bat', '.ps1', '.xml', '.csv'}
            
            return file_path.suffix.lower() in text_extensions
        except:
            return False
    
    def _get_file_tech_type(self, extension):
        """Map file extension to technology type"""
        for tech, extensions in self.tech_patterns.items():
            if extension in extensions:
                return tech
        return None
    
    def _detect_technologies(self, file_catalog):
        """Detect all technologies present in the project"""
        detected_tech = {}
        
        for tech_type, files in file_catalog['files_by_type'].items():
            if files:
                total_files = len(files)
                total_chars = sum(f.get('size_chars', 0) for f in files)
                
                detected_tech[tech_type] = {
                    'file_count': total_files,
                    'total_chars': total_chars,
                    'files': files[:5]  # Sample of files
                }
        
        # Determine primary technology
        primary_tech = None
        if detected_tech:
            primary_tech = max(detected_tech.keys(), 
                             key=lambda x: detected_tech[x]['total_chars'])
        
        return {
            'primary_technology': primary_tech,
            'all_technologies': detected_tech,
            'technology_count': len(detected_tech)
        }
    
    def _identify_project_type(self, directory_path, tech_stack):
        """Identify the type of project based on structure and technologies"""
        directory_name = directory_path.name.lower()
        
        # Check directory name and structure for clues
        scores = defaultdict(int)
        
        # Score based on directory name
        for project_type, keywords in self.project_indicators.items():
            for keyword in keywords:
                if keyword in directory_name:
                    scores[project_type] += 2
        
        # Score based on subdirectory names
        try:
            for item in directory_path.iterdir():
                if item.is_dir():
                    dirname = item.name.lower()
                    for project_type, keywords in self.project_indicators.items():
                        for keyword in keywords:
                            if keyword in dirname:
                                scores[project_type] += 1
        except:
            pass
        
        # Score based on primary technology
        primary_tech = tech_stack.get('primary_technology', '')
        if primary_tech in ['PYTHON', 'R', 'SAS', 'MATLAB', 'SPSS', 'STATA']:
            scores['DATA_ANALYTICS'] += 3
        elif primary_tech in ['JAVASCRIPT', 'HTML', 'CSS', 'PHP']:
            scores['WEB_APPLICATION'] += 3
        elif primary_tech in ['JAVA', 'C#', 'GO']:
            scores['ENTERPRISE'] += 3
        
        # Determine project type
        if not scores:
            return 'GENERAL'
        
        return max(scores.keys(), key=lambda x: scores[x])
    
    def _calculate_metrics(self, file_catalog):
        """Calculate project complexity metrics"""
        all_files = file_catalog['all_files']
        
        total_files = len(all_files)
        total_chars = sum(f.get('size_chars', 0) for f in all_files)
        total_bytes = sum(f.get('size_bytes', 0) for f in all_files)
        
        # Calculate directory depth
        max_depth = 0
        if all_files:
            max_depth = max(len(Path(f['path']).parts) for f in all_files)
        
        # Count text vs binary files
        text_files = sum(1 for f in all_files if f.get('is_text', False))
        binary_files = total_files - text_files
        
        return {
            'total_files': total_files,
            'text_files': text_files,
            'binary_files': binary_files,
            'total_chars': total_chars,
            'total_bytes': total_bytes,
            'max_depth': max_depth,
            'avg_file_size_chars': total_chars // max(total_files, 1),
            'unique_extensions': len(file_catalog['files_by_extension'])
        }
    
    def _decide_chunking(self, file_catalog, metrics):
        """Decide if and how to chunk the project"""
        total_files = metrics['total_files']
        total_chars = metrics['total_chars']
        max_depth = metrics['max_depth']
        
        # Determine project size
        if (total_files <= self.chunking_thresholds['small_project']['max_files'] and 
            total_chars <= self.chunking_thresholds['small_project']['max_chars']):
            project_size = 'small'
        elif (total_files <= self.chunking_thresholds['medium_project']['max_files'] and 
              total_chars <= self.chunking_thresholds['medium_project']['max_chars']):
            project_size = 'medium'
        else:
            project_size = 'large'
        
        # Make chunking decision
        needs_chunking = False
        reason = "project_size_manageable"
        recommended_chunks = 1
        chunk_strategy = "none"
        
        if project_size in ['medium', 'large']:
            needs_chunking = True
            reason = "project_complexity"
            
            if project_size == 'medium':
                recommended_chunks = 2
            else:
                recommended_chunks = min(4, max_depth)  # Cap at 4 chunks
            
            chunk_strategy = "semantic_modules"
        
        # Override for very large projects
        if total_chars > 1000000:  # 1M characters
            needs_chunking = True
            reason = "context_limit"
            recommended_chunks = max(3, recommended_chunks)
        
        return {
            'needs_chunking': needs_chunking,
            'reason': reason,
            'recommended_chunks': recommended_chunks,
            'chunk_strategy': chunk_strategy,
            'project_size': project_size,
            'complexity_factors': {
                'file_count': total_files,
                'character_count': total_chars,
                'directory_depth': max_depth,
                'technology_diversity': len(file_catalog['files_by_type'])
            }
        }

# Test function
def test_discovery_agent(directory_path):
    """Test the discovery agent"""
    agent = ProjectDiscoveryAgent()
    
    try:
        result = agent.analyze_directory(directory_path)
        
        print("🔍 PROJECT DISCOVERY RESULTS")
        print("=" * 50)
        print(f"Project: {result['project_overview']['name']}")
        print(f"Type: {result['project_type']}")
        print(f"Files: {result['project_overview']['total_files']}")
        print(f"Primary Tech: {result['technology_stack']['primary_technology']}")
        print(f"Needs Chunking: {result['chunking_decision']['needs_chunking']}")
        
        if result['chunking_decision']['needs_chunking']:
            print(f"Chunks: {result['chunking_decision']['recommended_chunks']}")
            print(f"Strategy: {result['chunking_decision']['chunk_strategy']}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

# Example usage
if __name__ == "__main__":
    # Test with a directory path
    test_directory = "/home/rishav/Documents/Code/6th-sense/Optqo_repo_function/repository"  # Replace with actual path
    result = test_discovery_agent(test_directory)
    
    if result:
        # Pretty print full result
        print("\n📋 FULL ANALYSIS:")
        print(json.dumps(result, indent=2, default=str))