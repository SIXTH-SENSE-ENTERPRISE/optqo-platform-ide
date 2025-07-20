import os

def count_characters_in_folder(folder_path):
    """
    Counts the total number of characters in all files within a folder and its subfolders.

    Args:
        folder_path: The path to the folder.

    Returns:
        The total character count.
    """
    total_characters = 0
    for root, _, files in os.walk(folder_path):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    total_characters += len(content)
            except (UnicodeDecodeError, FileNotFoundError):
                print(f"Could not read file: {file_path}") # Handle potential errors
    return total_characters

# Example usage:
folder_path = "/home/rishav/Documents/Code/6th-sense/Optqo_repo_function/repository/BSEProject" # Replace with the actual folder path
character_count = count_characters_in_folder(folder_path)
print(f"Total number of characters: {character_count}")