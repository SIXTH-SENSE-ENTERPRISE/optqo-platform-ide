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
from memory_logger import save_memory, auto_save_memory
# Load environment variables
load_dotenv()

# Initialize AWS Bedrock client
client = boto3.client(
    'bedrock-runtime',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)

# Add this entire block here
import traceback
from datetime import datetime

class SimpleErrorRecovery:
    def __init__(self, max_retries=2):
        self.max_retries = max_retries
        self.error_history = []
        
    def record_error(self, step_type, error, context=None):
        """Record error with context for AI learning"""
        error_record = {
            'timestamp': datetime.now().isoformat(),
            'step_type': step_type,
            'error_type': type(error).__name__,
            'error_message': str(error),
            'context': context or {},
            'traceback': traceback.format_exc() if isinstance(error, Exception) else None
        }
        self.error_history.append(error_record)
        
        # Keep only last 10 errors to avoid memory bloat
        if len(self.error_history) > 10:
            self.error_history.pop(0)
            
        return error_record
    
    def get_error_context_for_ai(self):
        """Format error history for AI consumption"""
        if not self.error_history:
            return ""
            
        recent_errors = self.error_history[-3:]  # Last 3 errors
        
        error_summary = "RECENT ERRORS ENCOUNTERED:\n"
        for i, err in enumerate(recent_errors, 1):
            error_summary += f"{i}. {err['step_type']} failed: {err['error_message']}\n"
            if err.get('context'):
                error_summary += f"   Context: {err['context']}\n"
        
        error_summary += "\nPlease consider these errors when generating your response and suggest fixes if needed.\n"
        return error_summary

def extract_from_natural_language(content):
    """Simple extraction when structured parsing fails"""
    import re
    
    # Look for common patterns
    step_match = re.search(r'(?:step|action|phase):\s*(\w+)', content, re.IGNORECASE)
    tool_match = re.search(r'(?:tool|command):\s*(\w+)', content, re.IGNORECASE)
    content_match = re.search(r'(?:content|description):\s*(.+?)(?=\n\w+:|$)', content, re.IGNORECASE | re.DOTALL)
    input_match = re.search(r'(?:input|parameters):\s*(.+?)(?=\n\w+:|$)', content, re.IGNORECASE | re.DOTALL)
    
    if step_match:
        result = {'step': step_match.group(1).lower()}
        
        if tool_match:
            result['tool'] = tool_match.group(1)
        
        if input_match:
            result['input'] = input_match.group(1).strip()
        elif content_match:
            result['content'] = content_match.group(1).strip()
        
        return result
    
    return None


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

def enhanced_handle_action_step(parsed_response, error_recovery):
    """Enhanced action handler with error recovery"""
    tool = parsed_response.get("tool")
    
    if not tool:
        error_recovery.record_error(
            'action_validation',
            ValueError("No tool specified in action step"),
            {'parsed_response': parsed_response}
        )
        return "Error: No tool specified. Please specify a tool name."
    
    if tool not in TOOLS_MAP:
        available_tools = ", ".join(TOOLS_MAP.keys())
        error_recovery.record_error(
            'action_validation', 
            KeyError(f"Unknown tool: {tool}"),
            {'available_tools': available_tools}
        )
        return f"Error: Unknown tool '{tool}'. Available tools: {available_tools}"
    
    print(f"⛏️ ACTION: Calling {tool}")
    
    try:
        if tool == "fileManager":
            result = call_filemanager_simple(parsed_response)
        else:
            input_value = parsed_response.get("input", "")
            result = TOOLS_MAP[tool](input_value)
        
        print(f"📋 OBSERVE: {result}")
        return result
        
    except Exception as error:
        error_record = error_recovery.record_error(
            'tool_execution',
            error,
            {
                'tool': tool,
                'input': parsed_response.get("input", ""),
                'parsed_response': parsed_response
            }
        )
        
        error_msg = f"Tool '{tool}' failed: {str(error)}"
        print(f"❌ {error_msg}")
        
        # Return detailed error for AI to understand
        return f"{error_msg}\n\nError details: {error_record['error_message']}\nYou may want to try a different approach or fix the parameters."

    """Enhanced action handler with error recovery"""
    tool = parsed_response.get("tool")
    
    if not tool:
        error_recovery.record_error(
            'action_validation',
            ValueError("No tool specified in action step"),
            {'parsed_response': parsed_response}
        )
        return "Error: No tool specified. Please specify a tool name."
    
    if tool not in TOOLS_MAP:
        available_tools = ", ".join(TOOLS_MAP.keys())
        error_recovery.record_error(
            'action_validation', 
            KeyError(f"Unknown tool: {tool}"),
            {'available_tools': available_tools}
        )
        return f"Error: Unknown tool '{tool}'. Available tools: {available_tools}"
    
    print(f"⛏️ ACTION: Calling {tool}")
    
    try:
        if tool == "fileManager":
            result = call_filemanager_simple(parsed_response)
        else:
            input_value = parsed_response.get("input", "")
            result = TOOLS_MAP[tool](input_value)
        
        print(f"📋 OBSERVE: {result}")
        return result
        
    except Exception as error:
        error_record = error_recovery.record_error(
            'tool_execution',
            error,
            {
                'tool': tool,
                'input': parsed_response.get("input", ""),
                'parsed_response': parsed_response
            }
        )
        
        error_msg = f"Tool '{tool}' failed: {str(error)}"
        print(f"❌ {error_msg}")
        
        # Return detailed error for AI to understand
        return f"{error_msg}\n\nError details: {error_record['error_message']}\nYou may want to try a different approach or fix the parameters."

def parse_claude_natural(input_string):
    """
    Parse Claude's natural function call format, handling any content gracefully
    Works with: fileManager('operation', 'path', 'any content including CSS/HTML')
    """
    if not input_string or 'fileManager(' not in input_string:
        return None
    
    try:
        # Find the function call
        start = input_string.find('fileManager(') + 12  # Length of 'fileManager('
        
        # Find the matching closing parenthesis
        paren_count = 1
        end = start
        in_quote = False
        quote_char = None
        
        for i in range(start, len(input_string)):
            char = input_string[i]
            
            # Handle quotes
            if char in ["'", '"'] and not in_quote:
                in_quote = True
                quote_char = char
            elif char == quote_char and in_quote:
                in_quote = False
                quote_char = None
            elif not in_quote:
                if char == '(':
                    paren_count += 1
                elif char == ')':
                    paren_count -= 1
                    if paren_count == 0:
                        end = i
                        break
        
        # Extract arguments string
        args_str = input_string[start:end]
        
        # Simple split by comma, but only outside quotes
        args = []
        current_arg = ""
        in_quote = False
        quote_char = None
        
        for char in args_str:
            if char in ["'", '"'] and not in_quote:
                in_quote = True
                quote_char = char
            elif char == quote_char and in_quote:
                in_quote = False
                quote_char = None
            elif char == ',' and not in_quote:
                args.append(current_arg.strip().strip('\'"'))
                current_arg = ""
                continue
            
            current_arg += char
        
        # Add the last argument
        if current_arg.strip():
            args.append(current_arg.strip().strip('\'"'))
        
        return args
        
    except Exception:
        # If parsing fails, return None and let other methods handle it
        return None

def call_filemanager_simple(parsed_response):
    """
    Simple fileManager calling that handles Claude's natural output
    """
    input_value = parsed_response.get("input", "")
    
    # Try natural function call parsing first
    args = parse_claude_natural(input_value)
    
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
    
    # Fallback: check for structured parameters
    elif parsed_response.get("operation"):
        return file_manager(
            operation=parsed_response.get("operation"),
            filepath=parsed_response.get("filepath"),
            content=parsed_response.get("content"),
            destination=parsed_response.get("destination"),
            permissions=parsed_response.get("permissions")
        )
    
    return "Error: Could not parse fileManager parameters"

def simple_response_cleaner(response_content):
    """
    Minimal cleaner - just handle multiple steps and tabs
    """
    # Replace tabs with spaces
    response_content = response_content.replace('\t', '    ')
    
    # If multiple steps, keep only the first
    if response_content.count('step:') > 1:
        lines = response_content.split('\n')
        cleaned_lines = []
        step_found = False
        
        for line in lines:
            if line.strip().startswith('step:') and step_found:
                break
            cleaned_lines.append(line)
            if line.strip().startswith('step:'):
                step_found = True
        
        return '\n'.join(cleaned_lines).strip()
    
    return response_content.strip()

TOOLS_MAP = {
    "executeCommand": execute_command,
    "fileManager": file_manager,
}

file_manager_prompt = """
== TOOL USAGE ==
 
tool: fileManager
input: fileManager('read', 'requirements.txt')


- Examples input:
  * fileManager('read', 'file.txt')
  * fileManager('write', 'report.html', 'content here')
  * fileManager('copy', 'source.txt', '', 'destination.txt')
  * fileManager('chmod', 'script.sh', '', '', '755')

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
- Use platform-appropriate commands automatically
- If a command fails, the system will try alternatives

Available Tools:
- executeCommand(command): string Executes a given system command
- fileManager('operation', 'filepath', 'content', 'destination', 'permissions'): All file operations

== TOOL USAGE ==

For executeCommand:
step: action
tool: executeCommand
input: ls -la

{file_manager_prompt}

OUTPUT FORMATS:

THINK:
step: think
content: |
  Your reasoning here

ACTION:
step: action
tool: toolName
input: toolCommand or fileManager('operation', 'path', 'content')

OUTPUT:
step: output
content: |
  Your final answer


CRITICAL RULE: You MUST output exactly ONE step per response:
- If you want to think, output ONLY a think step
- If you want to take action, output ONLY an action step  
- If you want to give final output, output ONLY an output step
- NEVER combine multiple steps in one response

Output EXACTLY ONE YAML object per response. Never output multiple YAML objects.
Stop immediately after outputting one complete YAML structure.
"""

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print('\n👋 Goodbye!')
    sys.exit(0)

def enhanced_parse_response(response_content, error_recovery):
    """Parse Claude's response, trying YAML first, then JSON as fallback, with error recovery"""
    
    # Clean the response first
    cleaned_response = simple_response_cleaner(response_content)
    parsing_errors = []
    
    # Try YAML first (your original approach)
    try:
        parsed = yaml.safe_load(cleaned_response)
        if isinstance(parsed, dict) and 'step' in parsed:
            return parsed
        else:
            raise ValueError("Response missing required 'step' field")
    except Exception as e:
        parsing_errors.append(f"YAML parsing: {str(e)}")
    
    # Try JSON as fallback
    try:
        parsed = json.loads(cleaned_response)
        if isinstance(parsed, dict) and 'step' in parsed:
            print("✅ Fell back to JSON parsing successfully")
            return parsed
        else:
            raise ValueError("JSON response missing required 'step' field")
    except Exception as e:
        parsing_errors.append(f"JSON parsing: {str(e)}")
    
    # Try extracting from natural language if structured parsing fails
    try:
        extracted = extract_from_natural_language(response_content)
        if extracted:
            print("✅ Used natural language extraction")
            return extracted
    except Exception as e:
        parsing_errors.append(f"Natural language extraction: {str(e)}")
    
    # Record the parsing failure
    error_record = error_recovery.record_error(
        'response_parsing',
        Exception(f"All parsing methods failed: {'; '.join(parsing_errors)}"),
        {'response_preview': response_content[:200]}
    )
    
    print(f"⚠️ All parsing methods failed. Using fallback response.")
    
    # Return a fallback response that the AI can work with
    return {
        'step': 'output',
        'content': f"I had trouble parsing my previous response. Here's what I was trying to say:\n\n{response_content}",
        'parsing_error': True,
        'error_id': len(error_recovery.error_history)
    }
#response formater to handle multiple steps
def clean_response(response_content):
    """
    Clean Claude's response to prevent YAML parsing errors
    - Removes multiple step declarations (keeps only the first one)
    - Strips extra whitespace
    """
    # First, replace all tabs with spaces to prevent YAML token errors
    response_content = response_content.replace('\t', '    ')
    # Count how many 'step:' declarations exist
    if response_content.count('step:') <= 1:
        return response_content.strip()
    
    # If multiple steps found, keep only the first complete step
    lines = response_content.split('\n')
    cleaned_lines = []
    step_found = False
    
    for line in lines:
        # If we hit a second 'step:', stop
        if line.strip().startswith('step:') and step_found:
            break
        
        cleaned_lines.append(line)
        
        # Mark that we found the first step
        if line.strip().startswith('step:'):
            step_found = True
    
    return '\n'.join(cleaned_lines).strip()
            
def main():
    # Initialize error recovery
    error_recovery = SimpleErrorRecovery()
    
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

    # Initialize step counter for auto-save
    step_counter = 0
    consecutive_errors = 0
    max_consecutive_errors = 3
    
    # Save initial state
    print(f"📝 {save_memory(messages, 'initial_state')}")
    
    while True:
        try:
            # Add error context to messages if we have recent errors
            error_context = error_recovery.get_error_context_for_ai()
            if error_context and consecutive_errors > 0:
                # Add error context as a system message
                messages.append({
                    "role": "user",
                    "content": f"SYSTEM ERROR CONTEXT:\n{error_context}\nPlease continue with this context in mind."
                })
            
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

            # Enhanced parsing with error recovery
            try:
                parsed_response = enhanced_parse_response(response_content, error_recovery)
                consecutive_errors = 0  # Reset error counter on successful parsing
            except Exception as parsing_error:
                consecutive_errors += 1
                
                if consecutive_errors >= max_consecutive_errors:
                    print(f"❌ Too many consecutive errors ({consecutive_errors}). Stopping.")
                    print(f"📝 {save_memory(messages, 'error_termination')}")
                    break
                
                # Create a fallback response
                parsed_response = {
                    'step': 'output',
                    'content': f"I encountered parsing errors. Here's my raw response:\n\n{response_content}",
                    'error_recovery': True
                }
            
            # Add the AI's response to the message history
            messages.append({
                "role": "assistant",
                "content": response_content,
            })

            step_counter += 1
            
            # Auto-save every 10 steps
            auto_save_msg = auto_save_memory(messages, step_counter)
            if auto_save_msg:
                print(f"📝 {auto_save_msg}")
            
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
                output_content = parsed_response.get('content')
                print(f"🤖 OUTPUT: {output_content}")
                
                # If there were errors, mention them in the final save
                final_state_name = 'final_state_with_errors' if error_recovery.error_history else 'final_state'
                print(f"📝 {save_memory(messages, final_state_name)}")
                
                # Show error summary if there were any errors
                if error_recovery.error_history:
                    print(f"\n⚠️ ERRORS ENCOUNTERED: {len(error_recovery.error_history)} errors during execution")
                    for err in error_recovery.error_history[-3:]:  # Show last 3
                        print(f"   - {err['step_type']}: {err['error_message']}")
                
                break
            
            # Handle ACTION step with enhanced error recovery
            if parsed_response.get("step") == "action":
                result = enhanced_handle_action_step(parsed_response, error_recovery)
    
                messages.append({
                    "role": "user",
                    "content": f"OBSERVE: {result}",
                })
                continue
            
            # If we get here, the response format was unexpected
            print(f"❌ Unexpected response format: {parsed_response}")
            
            # Record this as an error but continue
            error_recovery.record_error(
                'response_format',
                ValueError(f"Unexpected step type: {parsed_response.get('step')}"),
                {'parsed_response': parsed_response}
            )
            
            # Ask AI to clarify
            messages.append({
                "role": "user",
                "content": f"I received an unexpected response format. Please provide a valid step (think/action/output).",
            })
            consecutive_errors += 1
            
            if consecutive_errors >= max_consecutive_errors:
                print(f"❌ Too many format errors. Stopping.")
                break
            
        except Exception as error:
            consecutive_errors += 1
            error_recovery.record_error('main_loop', error)
            
            print(f"❌ Error in main loop: {error}")
            
            if consecutive_errors >= max_consecutive_errors:
                print(f"❌ Too many consecutive errors. Stopping.")
                print(f"📝 {save_memory(messages, 'critical_error_state')}")
                break
            
            # Try to continue by asking the AI to help
            messages.append({
                "role": "user",
                "content": f"An error occurred: {str(error)}. Please suggest how to proceed or provide your final output.",
            })




if __name__ == "__main__":
    main()