import os
import re

SOURCE_DIR = "./content/posts"
TARGET_DIR = "./_posts"

if not os.path.exists(TARGET_DIR):
    os.makedirs(TARGET_DIR)

# Captures standard sequence: YYYYMMDD_FolderName
folder_pattern = re.compile(r"^(\d{4})(\d{2})(\d{2})_(.+)$")

def camel_to_kebab(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1-\2', s1).lower().replace('_', '-')

for item in os.listdir(SOURCE_DIR):
    item_path = os.path.join(SOURCE_DIR, item)
    if os.path.isdir(item_path):
        match = folder_pattern.match(item)
        if not match:
            continue
            
        year, month, day, folder_slug = match.groups()
        date_str = f"{year}-{month}-{day}"
        draft_path = os.path.join(item_path, "draft.md")
        if not os.path.exists(draft_path):
            continue
            
        with open(draft_path, "r", encoding="utf-8") as f:
            raw_content = f.read()
            
        front_matter = {}
        body_content = raw_content
        
        if raw_content.startswith("---"):
            parts = raw_content.split("---", 2)
            if len(parts) >= 3:
                body_content = parts[2]
                for line in parts[1].split("\n"):
                    if ":" in line:
                        k, v = line.split(":", 1)
                        front_matter[k.strip().lower()] = v.strip().strip('"').strip("'")

        # Explicit slug assignment inside front matter takes absolute priority
        final_slug = front_matter.get("slug") or front_matter.get("permalink")
        if final_slug:
            final_slug = final_slug.strip("/")
        else:
            final_slug = camel_to_kebab(folder_slug)
            
        if "title" not in front_matter:
            front_matter["title"] = final_slug.replace("-", " ").title()

        # Construct clean, consistent Jekyll Metadata Header
        new_front_matter = "--- \n"
        new_front_matter += f"title: \"{front_matter['title']}\"\n"
        new_front_matter += f"date: {date_str}\n"
        new_front_matter += f"permalink: /{final_slug}/\n"
        
        for key, val in front_matter.items():
            if key not in ["title", "date", "permalink", "slug"]:
                new_front_matter += f"{key}: {val}\n"
        new_front_matter += "---\n"
        
        final_markdown = new_front_matter + body_content
        output_filename = f"{date_str}-{final_slug}.md"
        output_path = os.path.join(TARGET_DIR, output_filename)
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(final_markdown)
            
        print(f"Processed: {output_filename}")

print("\nData extraction pass complete.")
