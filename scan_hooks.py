import os
import re

directory = "/Users/macbookpro/Desktop/FactticAI"
hooks = []

for root, dirs, files in os.walk(directory):
    if "node_modules" in root or ".next" in root or ".git" in root:
        continue
    
    for f in files:
        if f.startswith("use") and f.endswith((".ts", ".tsx", ".js", ".jsx")):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
                
            hook_name = f.split(".")[0]
            
            # Extract description
            desc = ""
            doc_match = re.search(r"/\*\*([\s\S]*?)\*/", content)
            if doc_match:
                for line in doc_match.group(1).splitlines():
                    clean_line = line.strip().lstrip("*").strip()
                    if clean_line and not clean_line.startswith("@"):
                        desc = clean_line
                        break
            
            if not desc:
                for line in content.splitlines()[:15]:
                    line = line.strip()
                    if line.startswith("//") and not line.startswith("// eslint") and not line.startswith("// @"):
                        desc = line.lstrip("/").strip()
                        break
                        
            if not desc:
                # Fallback to finding the return statement or a brief guess
                desc = "No description available"
                
            hooks.append({
                "name": hook_name,
                "file": filepath.replace("/Users/macbookpro/Desktop/FactticAI", ""),
                "desc": desc
            })

hooks.sort(key=lambda x: x["name"])

print("## React Hooks\n")
print("| Hook Name | File Path | Purpose |")
print("|---|---|---|")

for h in hooks:
    desc_clean = h['desc'].replace('|', '-').replace('\n', ' ')
    print(f"| {h['name']} | {h['file']} | {desc_clean} |")
