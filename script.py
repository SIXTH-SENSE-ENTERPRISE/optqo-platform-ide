import boto3
import subprocess
import json
import sys
import os
from dotenv import load_dotenv
import signal
import yaml
import shutil
import stat
from pathlib import Path
# Load environment variables
load_dotenv()

# Initialize AWS Bedrock client
client = boto3.client(
    'bedrock-runtime',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)

def execute_command(command):
    """Execute a system command and return the output"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30  # 30 second timeout
        )
        return f"stdout: {result.stdout}\nstderr: {result.stderr}"
    except subprocess.TimeoutExpired:
        return "Error: Command timed out after 30 seconds"
    except Exception as e:
        return f"Error: {str(e)}"


def file_manager(operation, filepath, content=None, destination=None, permissions=None, encoding='utf-8'):
    """
    Simple, forgiving file management tool for LLM use
    
    Args:
        operation (str): What to do - 'write', 'append', 'read', 'copy', 'move', 'delete', 'mkdir', 'chmod', 'exists', 'info'
        filepath (str): Path to file or directory
        content (str, optional): Content for write/append operations
        destination (str, optional): Target path for copy/move operations
        permissions (str/int, optional): File permissions (e.g., '755', 0o755, or 755)
        encoding (str): Text encoding (default: utf-8)
    
    Returns:
        str: Simple success message or error description
    """
    
    try:
        # Convert filepath to Path object for easier handling
        path = Path(filepath).expanduser().resolve()
        
        # Handle different operations
        if operation == 'write':
            return _write_file(path, content, encoding, permissions)
            
        elif operation == 'append':
            return _append_file(path, content, encoding)
            
        elif operation == 'read':
            return _read_file(path, encoding)
            
        elif operation == 'copy':
            if not destination:
                return "Error: copy operation requires destination parameter"
            return _copy_file(path, Path(destination).expanduser().resolve())
            
        elif operation == 'move':
            if not destination:
                return "Error: move operation requires destination parameter"
            return _move_file(path, Path(destination).expanduser().resolve())
            
        elif operation == 'delete':
            return _delete_file(path)
            
        elif operation == 'mkdir':
            return _make_directory(path, permissions)
            
        elif operation == 'chmod':
            if not permissions:
                return "Error: chmod operation requires permissions parameter"
            return _change_permissions(path, permissions)
            
        elif operation == 'exists':
            return _check_exists(path)
            
        elif operation == 'info':
            return _get_info(path)
            
        else:
            return f"Error: Unknown operation '{operation}'. Available: write, append, read, copy, move, delete, mkdir, chmod, exists, info"
            
    except Exception as e:
        return f"Error: {str(e)}"

def _write_file(path, content, encoding, permissions):
    """Write content to file, creating directories as needed"""
    if content is None:
        content = ""
    
    # Create parent directories if they don't exist
    path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write the file
    with open(path, 'w', encoding=encoding) as f:
        f.write(content)
    
    # Set permissions if specified
    if permissions:
        _set_permissions(path, permissions)
        perm_msg = f" with permissions {permissions}"
    else:
        perm_msg = ""
    
    return f"Successfully wrote {len(content)} characters to {path}{perm_msg}"

def _append_file(path, content, encoding):
    """Append content to file"""
    if content is None:
        content = ""
    
    # Create file if it doesn't exist
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'w', encoding=encoding) as f:
            pass  # Create empty file
    
    with open(path, 'a', encoding=encoding) as f:
        f.write(content)
    
    return f"Successfully appended {len(content)} characters to {path}"

def _read_file(path, encoding):
    """Read file contents"""
    if not path.exists():
        return f"Error: File {path} does not exist"
    
    if path.is_dir():
        return f"Error: {path} is a directory, not a file"
    
    try:
        with open(path, 'r', encoding=encoding) as f:
            content = f.read()
        return f"File content ({len(content)} characters):\n{content}"
    except UnicodeDecodeError:
        return f"Error: Cannot read {path} as text (may be binary file)"

def _copy_file(source, destination):
    """Copy file or directory"""
    if not source.exists():
        return f"Error: Source {source} does not exist"
    
    # Create destination parent directories if needed
    if destination.suffix or not destination.exists():  # It's a file or doesn't exist
        destination.parent.mkdir(parents=True, exist_ok=True)
    
    if source.is_file():
        shutil.copy2(source, destination)
        return f"Successfully copied file {source} to {destination}"
    else:
        shutil.copytree(source, destination, dirs_exist_ok=True)
        return f"Successfully copied directory {source} to {destination}"

def _move_file(source, destination):
    """Move/rename file or directory"""
    if not source.exists():
        return f"Error: Source {source} does not exist"
    
    # Create destination parent directories if needed
    destination.parent.mkdir(parents=True, exist_ok=True)
    
    shutil.move(str(source), str(destination))
    return f"Successfully moved {source} to {destination}"

def _delete_file(path):
    """Delete file or directory"""
    if not path.exists():
        return f"Note: {path} does not exist (already deleted)"
    
    if path.is_file():
        path.unlink()
        return f"Successfully deleted file {path}"
    else:
        shutil.rmtree(path)
        return f"Successfully deleted directory {path}"

def _make_directory(path, permissions):
    """Create directory"""
    path.mkdir(parents=True, exist_ok=True)
    
    if permissions:
        _set_permissions(path, permissions)
        perm_msg = f" with permissions {permissions}"
    else:
        perm_msg = ""
    
    return f"Successfully created directory {path}{perm_msg}"

def _change_permissions(path, permissions):
    """Change file permissions"""
    if not path.exists():
        return f"Error: {path} does not exist"
    
    _set_permissions(path, permissions)
    return f"Successfully changed permissions of {path} to {permissions}"

def _set_permissions(path, permissions):
    """Helper to set permissions from various formats"""
    if isinstance(permissions, str):
        if permissions.startswith('0o'):
            perm_int = int(permissions, 8)
        else:
            perm_int = int(permissions, 8)
    else:
        perm_int = permissions
    
    os.chmod(path, perm_int)

def _check_exists(path):
    """Check if file or directory exists"""
    if path.exists():
        file_type = "directory" if path.is_dir() else "file"
        return f"Yes: {path} exists (it's a {file_type})"
    else:
        return f"No: {path} does not exist"

def _get_info(path):
    """Get file/directory information"""
    if not path.exists():
        return f"Error: {path} does not exist"
    
    stat_info = path.stat()
    file_type = "directory" if path.is_dir() else "file"
    size = stat_info.st_size
    permissions = oct(stat.S_IMODE(stat_info.st_mode))
    
    from datetime import datetime
    modified = datetime.fromtimestamp(stat_info.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
    
    return f"{path} is a {file_type}, size: {size} bytes, permissions: {permissions}, modified: {modified}"
# Tools mapping

import re

def parse_filemanager_input(input_string):
    """
    Parse fileManager input in various formats and return parameters
    """
    if not input_string:
        return None
    
    # Handle function call format: fileManager('read', 'file.txt', 'content')
    if 'fileManager(' in input_string:
        # Extract content between parentheses
        match = re.search(r'fileManager\((.*)\)', input_string)
        if match:
            args_str = match.group(1)
            # Simple split by comma and clean quotes
            args = [arg.strip().strip('\'"') for arg in args_str.split(',')]
            return args
    
    # Handle simple comma format: 'read', 'file.txt'
    elif ',' in input_string:
        args = [arg.strip().strip('\'"') for arg in input_string.split(',')]
        return args
    
    return None

def call_filemanager_flexibly(parsed_response):
    """
    Call fileManager with flexible input parsing
    """
    # Method 1: Check for structured parameters (operation, filepath, etc.)
    if parsed_response.get("operation"):
        return file_manager(
            operation=parsed_response.get("operation"),
            filepath=parsed_response.get("filepath"),
            content=parsed_response.get("content"),
            destination=parsed_response.get("destination"),
            permissions=parsed_response.get("permissions")
        )
    
    # Method 2: Parse the input field
    input_value = parsed_response.get("input", "")
    args = parse_filemanager_input(input_value)
    
    if args and len(args) >= 2:
        operation = args[0]
        filepath = args[1]
        content = args[2] if len(args) > 2 else None
        destination = args[3] if len(args) > 3 else None
        permissions = args[4] if len(args) > 4 else None
        
        return file_manager(
            operation=operation,
            filepath=filepath,
            content=content,
            destination=destination,
            permissions=permissions
        )
    
    return "Error: Could not parse fileManager parameters"

# REPLACE YOUR ACTION HANDLING SECTION WITH THIS:
def handle_action_step(parsed_response):
    """Handle ACTION step with flexible tool calling"""
    tool = parsed_response.get("tool")
    
    if not tool or tool not in TOOLS_MAP:
        return f"Error: Unknown tool '{tool}'"
    
    print(f"⛏️ ACTION: Calling {tool}")
    
    try:
        if tool == "fileManager":
            result = call_filemanager_flexibly(parsed_response)
        else:
            # For other tools, use input directly
            input_value = parsed_response.get("input", "")
            result = TOOLS_MAP[tool](input_value)
        
        print(f"📋 OBSERVE: {result}")
        return result
        
    except Exception as error:
        error_msg = f"Tool execution failed: {error}"
        print(f"❌ {error_msg}")
        return error_msg

TOOLS_MAP = {
    "executeCommand": execute_command,
    "fileManager": file_manager,
}

file_manager_prompt = """
== TOOL USAGE ==

For fileManager (any of these formats work):

METHOD 1 - Function call style (easiest):
step: action
tool: fileManager
input: fileManager('write', 'report.html', 'content here')

METHOD 2 - Simple parameters:
step: action
tool: fileManager
input: 'read', 'filename.txt'

METHOD 3 - Structured (for complex operations):
step: action
tool: fileManager
operation: write
filepath: report.html
content: |
  <!DOCTYPE html>
  <html>...</html>
permissions: '755'

EXAMPLE -

== FILEMANAGER OPERATIONS ==
- read: Read file contents
- write: Create/overwrite files
- append: Add to existing files
- copy: Copy files (needs destination)
- move: Move/rename files (needs destination)
- delete: Remove files/folders
- mkdir: Create directories
- chmod: Change permissions
- exists: Check if file exists
- info: Get file details

== EXAMPLES ==

Read a file:
step: action
tool: fileManager
input: fileManager('read', 'requirements.txt')

Make script executable:
step: action
tool: fileManager
input: fileManager('chmod', 'script.sh', '755')

SIMPLE CONTENT (use function call):
step: action
tool: fileManager
input: fileManager('read', 'requirements.txt')

COMPLEX CONTENT (use structured format):
step: action
tool: fileManager
operation: write
filepath: report.html
content: |
  <!DOCTYPE html>
  <html>
    <style>body { color: blue; }</style>
    <body><h1>Report</h1></body>
  </html>

For SIMPLE operations (single line, no special characters):
step: action
tool: fileManager
input: fileManager('read', 'filename.txt')

For COMPLEX content (HTML, CSS, code, multiple lines, or content with colons):
step: action
tool: fileManager
operation: write
filepath: filename.html
content: |
  Your complex content here
  Can include colons: like this
  Multiple lines
  HTML tags <div>etc</div>

IMPORTANT: Use structured format (operation/filepath/content) for ANY content that contains:
- Colons (:)
- Multiple lines  
- HTML/CSS/JavaScript
- Code files
- Complex text

Examples:
- fileManager('read', 'simple.txt') ✓
- Use structured format for HTML files ✓

Rule: Use structured format for HTML, CSS, code, or any content with colons/quotes

IMPORTANT: fileManager creates parent directories automatically and handles all file operations safely.
"""

SYSTEM_PROMPT = f"""
You are a helpful AI Assistant who is designed to resolve user queries.
You work on START, THINK, ACTION, OBSERVE and OUTPUT Mode.

In the start phase, user gives a query to you.
Then, you THINK how to resolve that query at least 3-4 times and make decisions.
If there is a need to call a tool, you call an ACTION event with tool name and input.
If there is an action call, wait for the OBSERVE that is output of the tool.
Based on the OBSERVE from prev step, you either output or repeat the loop.

Rules:
- Always wait for next step.
- Always output a single step and wait for the next step.
- Output must be strictly YAML
- Only call tool action from Available tools only.
- Strictly follow the output format in YAML
- For multi-line commands, use YAML literal block scalars (|)
- Use platform-appropriate commands automatically
- If a command fails, the system will try alternatives

Available Tools:
- executeCommand(command): string Executes a given system command
- fileManager(operation, filepath, content=None, destination=None, permissions=None): All file operations

== TOOL USAGE ==

For executeCommand:
step: action
tool: executeCommand
input: ls -la

{file_manager_prompt}

Output Format:
For THINK: 
step: think
content: |
  your thinking process
  with proper indentation

For ACTION (simple commands):
step: action
tool: toolName
input: | simple command

For ACTION (multi-line commands):
step: action
tool: toolName
input: |
  multi-line
  command here
  with proper indentation

For OUTPUT:
step: output
content: | your final response

Output EXACTLY ONE YAML object per response. Never output multiple YAML objects.
Stop immediately after outputting one complete YAML structure.
"""

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print('\n👋 Goodbye!')
    sys.exit(0)

def parse_response(response_content):
    """Parse Claude's response, trying YAML first, then JSON as fallback"""
    try:
        # Try YAML first (better for multi-line content)
        parsed = yaml.safe_load(response_content)
        
        # Validate that we have the required structure
        if not isinstance(parsed, dict) or 'step' not in parsed:
            raise ValueError("Response missing required 'step' field")
            
        return parsed
        
    except (yaml.YAMLError, ValueError) as yaml_error:
        print(f"⚠️ YAML parsing failed: {yaml_error}")
        
        # Fall back to JSON parsing
        try:
            parsed = json.loads(response_content)
            print("✅ Fell back to JSON parsing successfully")
            return parsed
            
        except json.JSONDecodeError as json_error:
            print(f"❌ Both YAML and JSON parsing failed")
            print(f"YAML Error: {yaml_error}")
            print(f"JSON Error: {json_error}")
            raise json_error
            
def main():
    # Set up signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    
    # Get user query from command line arguments or use default
    user_query = sys.argv[1] if len(sys.argv) > 1 else 'List files in current directory'
    
    messages = [
        {
            "role": "user",
            "content": user_query,
        }
    ]
    
    print(f"🚀 Starting query: {user_query}")
    
    while True:
        try:
            # Prepare the request body for AWS Bedrock
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1024,
                "system": SYSTEM_PROMPT,
                "messages": messages
            }
            
            response = client.invoke_model(
                modelId="arn:aws:bedrock:us-east-1:216989122843:inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0",
                body=json.dumps(request_body),
                contentType="application/json"
            )
            response_body = json.loads(response['body'].read())
            response_content = response_body['content'][0]['text']

            # response_content = response.content[0].text
            
            # FIXED: Use the parse_response function instead of direct yaml.safe_load
            try:
                parsed_response = parse_response(response_content)
            except Exception as parsing_error:
                print(f"❌ Failed to parse response: {response_content}")
                print(f"Parsing Error: {parsing_error}")
                break
            
            # Add the AI's response to the message history
            messages.append({
                "role": "assistant",
                "content": response_content,
            })
            
            # Handle THINK step
            if parsed_response.get("step") == "think":
                print(f"🧠 THINK: {parsed_response.get('content')}")
                
                # Add a user message to continue the conversation
                messages.append({
                    "role": "user",
                    "content": "Continue to the next step.",
                })
                continue
            
            # Handle OUTPUT step
            if parsed_response.get("step") == "output":
                print(f"🤖 OUTPUT: {parsed_response.get('content')}")
                break
            
            # Handle ACTION step
            if parsed_response.get("step") == "action":
                result = handle_action_step(parsed_response)
    
                messages.append({
                    "role": "user",
                    "content": f"OBSERVE: {result}",
                })
                continue
            
            # If we get here, the response format was unexpected
            print(f"❌ Unexpected response format: {parsed_response}")
            break
            
        except Exception as error:
            print(f"❌ Error in main loop: {error}")
            break




if __name__ == "__main__":
    main()