import json
import os

def validate_json(file_path):
    print(f"\n[{file_path}]")
    if not os.path.exists(file_path):
        print("  SKIP: Not found.")
        return
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            json.loads(content)
            print("  SUCCESS: Valid JSON.")
    except json.JSONDecodeError as e:
        print(f"  ERROR: {e.msg} at Line {e.lineno}, Col {e.colno}")
    except Exception as e:
        print(f"  FAILED: {str(e)}")

for f in ['questions.json', 'java.js', 'python.js', 'c.js', 'cpp.js']:
    validate_json(f)
