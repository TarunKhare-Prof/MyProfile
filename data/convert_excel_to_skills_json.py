import pandas as pd
import json
import os

# Input and output file in same directory
excel_file = "skills_entry.xlsx"
json_file = "skills.json"

# Check if Excel file exists
if not os.path.exists(excel_file):
    print(f"❌ Error: '{excel_file}' not found.")
    exit(1)

# Read the Excel file
df = pd.read_excel(excel_file)

# Normalize headers (lowercase, underscore-separated)
df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]

# Drop completely blank rows
df.dropna(how='all', inplace=True)

# Fill NaNs with empty strings
df.fillna('', inplace=True)

# Final expected order and keys
expected_keys = ["category", "name", "level", "status", "remarks"]
records = df.to_dict(orient="records")
cleaned = [{k: row.get(k, '') for k in expected_keys} for row in records]

# Save as pretty-printed JSON
with open(json_file, "w", encoding="utf-8") as f:
    json.dump(cleaned, f, indent=2, ensure_ascii=False)

print(f"✅ Successfully converted '{excel_file}' → '{json_file}'")
