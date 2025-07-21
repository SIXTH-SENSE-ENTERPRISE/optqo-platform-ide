import json
import os
from datetime import datetime

def save_memory(messages, filename=None):
    """
    Save conversation memory to a JSON file
    
    Args:
        messages (list): The conversation messages array
        filename (str, optional): Custom filename. Auto-generates if None.
    
    Returns:
        str: Success message with filepath or error message
    """
    try:
        # Create logs directory if it doesn't exist
        os.makedirs("logs", exist_ok=True)
        
        # Generate filename with timestamp if not provided
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"memory_{timestamp}.json"
        
        # Ensure .json extension
        if not filename.endswith('.json'):
            filename += '.json'
        
        filepath = os.path.join("logs", filename)
        
        # Create log data
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "total_messages": len(messages),
            "conversation": messages
        }
        
        # Save to file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)
        
        return f"Memory saved: {filepath}"
        
    except Exception as e:
        return f"Error saving memory: {str(e)}"

def auto_save_memory(messages, step_count, save_every=10):
    """
    Auto-save memory every N steps
    
    Args:
        messages (list): The conversation messages
        step_count (int): Current step number
        save_every (int): Save frequency
    
    Returns:
        str: Save message or empty string if not saved
    """
    if step_count > 0 and step_count % save_every == 0:
        filename = f"auto_save_step_{step_count:03d}"
        return save_memory(messages, filename)
    return ""