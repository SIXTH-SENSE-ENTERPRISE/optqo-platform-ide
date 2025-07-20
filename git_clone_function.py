import subprocess
import os
from pathlib import Path

def clone_repo(repo_url, project_directory="."):
    """
    Clone a git repository into the specified project directory.
    
    Args:
        repo_url (str): The git repository URL to clone
        project_directory (str): Directory where the repo should be cloned (default: current directory)
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Ensure the project directory exists
        Path(project_directory).mkdir(parents=True, exist_ok=True)
        
        # Run git clone command
        result = subprocess.run(
            ["git", "clone", repo_url],
            cwd=project_directory,
            capture_output=True,
            text=True,
            check=True
        )
        
        print(f"Successfully cloned {repo_url}")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Error cloning repository: {e.stderr}")
        return False
    except FileNotFoundError:
        print("Git is not installed or not found in PATH")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False


# Example usage
if __name__ == "__main__":
    # Clone into current directory
    clone_repo("https://github.com/SIXTH-SENSE-ENTERPRISE/BSEProject", "./repository")

