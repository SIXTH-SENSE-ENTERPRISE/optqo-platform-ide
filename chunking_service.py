import os
import json
import boto3
from pathlib import Path
from datetime import datetime
import traceback
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time

class ChunkingService:
    def __init__(self, log_dir="log"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = self.log_dir / f"chunking_service_{timestamp}.json"
        
        self.chunking_log = {
            "timestamp": timestamp,
            "service": "chunking_service",
            "operations": [],
            "final_result": None
        }
        
        print(f"📝 Chunking Service logging to: {self.log_file}")
    
    def _log_operation(self, operation, description, data=None):
        """Log chunking operations"""
        op_info = {
            "operation": operation,
            "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "description": description
        }
        if data:
            op_info["data"] = data
        
        self.chunking_log["operations"].append(op_info)
        print(f"🔄 CHUNKING: {description}")
    
    def create_analysis_chunks(self, agent1_output):
        """Convert Agent 1 output into content-rich chunks for specialist analysis"""
        
        self._log_operation("INIT", "Starting chunk creation from Agent 1 output")
        
        try:
            # Extract Agent 1 data
            project_overview = agent1_output['project_overview']
            file_catalog = agent1_output['file_catalog']
            chunking_decision = agent1_output['chunking_decision']
            
            # Create project context for all agents
            project_context = {
                "name": project_overview['name'],
                "path": project_overview['path'],
                "total_files": project_overview['total_files'],
                "total_size_chars": project_overview['total_size_chars'],
                "primary_technology": agent1_output['technology_stack']['primary_technology'],
                "all_technologies": list(agent1_output['technology_stack']['all_technologies'].keys()),
                "project_type": agent1_output['project_type']
            }
            
            # Create chunks with actual content
            if not chunking_decision['needs_chunking']:
                self._log_operation("SINGLE_CHUNK", "Creating single chunk for small project")
                chunks = [self._create_single_chunk(file_catalog)]
            else:
                self._log_operation("MULTI_CHUNK", f"Creating {chunking_decision['recommended_chunks']} chunks")
                chunks = self._create_multiple_chunks(file_catalog, chunking_decision)
            
            # Prepare final output for specialist agents
            specialist_input = {
                "project_context": project_context,
                "chunks": chunks,
                "analysis_metadata": {
                    "chunking_strategy": chunking_decision['chunk_strategy'],
                    "total_chunks": len(chunks),
                    "chunking_reason": chunking_decision['reason']
                }
            }
            
            self.chunking_log["final_result"] = {
                "chunks_created": len(chunks),
                "total_content_chars": sum(chunk.get('content_chars', 0) for chunk in chunks),
                "success": True
            }
            
            self._log_operation("COMPLETE", f"Successfully created {len(chunks)} chunks")
            self._save_log()
            
            return specialist_input
            
        except Exception as e:
            self._log_operation("ERROR", f"Chunking failed: {str(e)}")
            self.chunking_log["error"] = str(e)
            self._save_log()
            raise
    
    def _create_single_chunk(self, file_catalog):
        """Create single chunk for small projects"""
        
        chunk_files = []
        total_content = ""
        content_chars = 0
        
        for file_info in file_catalog['all_files']:
            if file_info.get('is_text', False):
                try:
                    with open(file_info['absolute_path'], 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        
                    chunk_files.append({
                        'name': file_info['name'],
                        'path': file_info['path'],
                        'extension': file_info['extension'],
                        'size_chars': len(content),
                        'content': content
                    })
                    
                    total_content += f"\n{'='*50}\nFILE: {file_info['name']}\nPATH: {file_info['path']}\n{'='*50}\n"
                    total_content += content + "\n\n"
                    content_chars += len(content)
                    
                except Exception as e:
                    print(f"⚠️ Could not read file {file_info['name']}: {e}")
        
        return {
            'chunk_id': 'single_chunk',
            'files': chunk_files,
            'content': total_content,
            'content_chars': content_chars,
            'file_count': len(chunk_files)
        }
    
    def _create_multiple_chunks(self, file_catalog, chunking_decision):
        """Create multiple chunks based on size distribution"""
        
        recommended_chunks = chunking_decision['recommended_chunks']
        total_chars = sum(f.get('size_chars', 0) for f in file_catalog['all_files'] if f.get('is_text', False))
        chunk_size_target = total_chars // recommended_chunks
        
        chunks = []
        current_chunk_files = []
        current_chunk_content = ""
        current_chunk_chars = 0
        
        # Sort files by size for better distribution
        text_files = [f for f in file_catalog['all_files'] if f.get('is_text', False)]
        sorted_files = sorted(text_files, key=lambda x: x.get('size_chars', 0), reverse=True)
        
        for file_info in sorted_files:
            try:
                with open(file_info['absolute_path'], 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                file_chars = len(content)
                
                # If adding this file exceeds target and we have files, start new chunk
                if (current_chunk_chars + file_chars > chunk_size_target and 
                    current_chunk_files and 
                    len(chunks) < recommended_chunks - 1):
                    
                    # Finalize current chunk
                    chunks.append({
                        'chunk_id': f'chunk_{len(chunks) + 1}',
                        'files': current_chunk_files.copy(),
                        'content': current_chunk_content,
                        'content_chars': current_chunk_chars,
                        'file_count': len(current_chunk_files)
                    })
                    
                    # Start new chunk
                    current_chunk_files = []
                    current_chunk_content = ""
                    current_chunk_chars = 0
                
                # Add file to current chunk
                current_chunk_files.append({
                    'name': file_info['name'],
                    'path': file_info['path'],
                    'extension': file_info['extension'],
                    'size_chars': file_chars,
                    'content': content
                })
                
                current_chunk_content += f"\n{'='*50}\nFILE: {file_info['name']}\nPATH: {file_info['path']}\n{'='*50}\n"
                current_chunk_content += content + "\n\n"
                current_chunk_chars += file_chars
                
            except Exception as e:
                print(f"⚠️ Could not read file {file_info['name']}: {e}")
        
        # Add remaining files as final chunk
        if current_chunk_files:
            chunks.append({
                'chunk_id': f'chunk_{len(chunks) + 1}',
                'files': current_chunk_files,
                'content': current_chunk_content,
                'content_chars': current_chunk_chars,
                'file_count': len(current_chunk_files)
            })
        
        return chunks
    
    def _save_log(self):
        """Save chunking log"""
        try:
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump(self.chunking_log, f, indent=2, default=str)
        except Exception as e:
            print(f"⚠️ Failed to save chunking log: {e}")

