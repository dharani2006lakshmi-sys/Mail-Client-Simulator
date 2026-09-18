import os
import glob

for ext in ['**/*.html', '**/*.js']:
    for file_path in glob.glob(ext, recursive=True):
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        
        if '?"' in content or '' in content:
            content = content.replace('?"', '-')
            content = content.replace('', '')
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed {file_path}")
