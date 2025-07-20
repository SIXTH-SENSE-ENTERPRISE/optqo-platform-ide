import anthropic
import subprocess
import json
import sys
import os
from dotenv import load_dotenv
import signal
import yaml

# Load environment variables
load_dotenv()

# Initialize Anthropic client
client = anthropic.Anthropic(
    api_key=os.getenv('ANTHROPIC_API_KEY')
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

# Tools mapping
TOOLS_MAP = {
    "executeCommand": execute_command,
}

SYSTEM_PROMPT = """
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
            response = client.messages.create(
                model="claude-3-7-sonnet-20250219",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=messages,
            )
            
            response_content = response.content[0].text
            
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
                tool = parsed_response.get("tool")
                input_value = parsed_response.get("input")
                
                if tool not in TOOLS_MAP:
                    print(f"❌ Unknown tool: {tool}")
                    break
                
                print(f"⛏️ ACTION: Calling {tool} with input: {input_value}")
                
                try:
                    result = TOOLS_MAP[tool](input_value)
                    print(f"📋 OBSERVE: {result}")
                    
                    # Add the observation to the message history
                    messages.append({
                        "role": "user",
                        "content": f"OBSERVE: {result}",
                    })
                except Exception as error:
                    print(f"❌ Tool execution failed: {error}")
                    messages.append({
                        "role": "user",
                        "content": f"OBSERVE: Error - {error}",
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