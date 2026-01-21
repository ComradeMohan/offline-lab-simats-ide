import json
import os

def validate_json(file_path):
    print(f"Validating {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            json.loads(content)
            print("SUCCESS: JSON is valid.")
    except json.JSONDecodeError as e:
        print(f"ERROR: {e.msg} at line {e.lineno}, column {e.colno}")
        # Print the surrounding context
        lines = content.splitlines()
        start = max(0, e.lineno - 3)
        end = min(len(lines), e.lineno + 2)
        for i in range(start, end):
            prefix = ">>>" if i == e.lineno - 1 else "   "
            print(f"{prefix} {i+1}: {lines[i]}")
    except Exception as e:
        print(f"FAILED: {str(e)}")

files = ['questions.json', 'java.js', 'python.js', 'c.js', 'cpp.js']
for f in files:
    if os.path.exists(f):
        validate_json(f)
    else:
        print(f"SKIP: {f} not found.")
