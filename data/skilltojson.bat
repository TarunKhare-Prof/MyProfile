@echo off
set EXCEL_FILE=skills_entry.xlsx
set JSON_FILE=skills.json

echo Converting %EXCEL_FILE% to %JSON_FILE%...

python - <<EOF
import pandas as pd
import json

# Read the Excel file
df = pd.read_excel("%EXCEL_FILE%")

# Ensure correct column names
df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]

# Drop completely empty rows
df.dropna(how='all', inplace=True)

# Fill NaN with empty strings
df.fillna('', inplace=True)

# Convert to records
records = df.to_dict(orient='records')

# Filter to expected keys
expected_keys = ["category", "name", "level", "status", "remarks"]
cleaned = [{k: row.get(k, '') for k in expected_keys} for row in records]

# Save to JSON
with open("%JSON_FILE%", "w", encoding="utf-8") as f:
    json.dump(cleaned, f, indent=2, ensure_ascii=False)

print("Conversion complete: %JSON_FILE%")
EOF

pause
