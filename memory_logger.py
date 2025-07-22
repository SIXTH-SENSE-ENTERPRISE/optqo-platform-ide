import json
import os
from datetime import datetime

def save_memory(messages, state_name, error_history=None):
    """Save conversation state and error history"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"memory_{state_name}_{timestamp}.json"
    
    memory_data = {
        "timestamp": datetime.now().isoformat(),
        "state_name": state_name,
        "total_messages": len(messages),
        "conversation": messages,
        "error_history": error_history or []
    }
    
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(memory_data, f, indent=2, ensure_ascii=False)
        return f"Memory saved to {filename}"
    except Exception as e:
        return f"Failed to save memory: {e}"

def auto_save_memory(messages, step_counter, error_history=None):
    """Auto-save memory every 10 steps with error history"""
    if step_counter % 10 == 0:
        return save_memory(messages, f'auto_step_{step_counter}', error_history)
    return None