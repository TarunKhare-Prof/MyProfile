@echo off
set EXCEL_FILE=skills_entry.xlsx
set JSON_FILE=skills.json

echo Converting %EXCEL_FILE% to %JSON_FILE%...
python -c "import pandas as pd; pd.read_excel('%EXCEL_FILE%').to_json('%JSON_FILE%', orient='records', indent=2)"
echo Done.
pause
