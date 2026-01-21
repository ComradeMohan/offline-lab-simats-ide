import json
import os

def validate_json(file_path):
    print(f"--- Validating {file_path} ---")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            json.loads(content)
            print("SUCCESS: JSON is valid.")
    except json.JSONDecodeError as e:
        print(f"ERROR: {e.msg}")
        print(f"Location: Line {e.lineno}, Column {e.colno}")
        lines = content.splitlines()
        start = max(0, e.lineno - 5)
        end = min(len(lines), e.lineno + 5)
        for i in range(start, end):
            prefix = ">>>" if i == e.lineno - 1 else f"{i+1:3}:"
            print(f"{prefix} {lines[i]}")
    except Exception as e:
        print(f"FAILED: {str(e)}")

validate_json('cpp.js')
validate_json('java.js')
validate_json('python.js')
validate_json('c.js')
