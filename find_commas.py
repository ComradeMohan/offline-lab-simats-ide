import re
import os

def find_trailing_commas(file_path):
    print(f"Checking {file_path} for trailing commas...")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex for comma followed by closing brace or bracket, possibly with whitespace/newlines
    pattern = r',\s*([}\]])'
    matches = list(re.finditer(pattern, content))
    
    if not matches:
        print("  None found.")
    else:
        for m in matches:
            line_no = content[:m.start()].count('\n') + 1
            print(f"  Found at line {line_no}: '{m.group(0)}'")

find_trailing_commas('cpp.js')
find_trailing_commas('java.js')
find_trailing_commas('python.js')
find_trailing_commas('c.js')
