@echo off
setlocal EnableDelayedExpansion

:: Configuration
set "IMAGE_DIR=images"
set "OUTPUT_FILE=data\personal_projects.json"

:: Supported extensions
set "VIDEO_EXT=.mp4 .webm .ogg"
set "IMAGE_EXT=.jpg .jpeg .png .gif"

:: Start JSON array
> "%OUTPUT_FILE%" echo [

set "firstEntry=true"
for %%F in (%IMAGE_DIR%\*) do (
    set "filename=%%~nxF"
    set "name=%%~nF"
    set "ext=%%~xF"
    set "type=image"

    for %%V in (%VIDEO_EXT%) do (
        if /I "%%~xF"=="%%V" set "type=video"
    )

    set "title=!name:_= !"

    for /f "tokens=1-3 delims=/" %%a in ("%%~tF") do (
        set "day=%%a"
        set "month=%%b"
        set "year=%%c"
    )
    set "date=!year!-!month!-!day!"

    if not "!firstEntry!"=="true" >> "%OUTPUT_FILE%" echo ,
    set "firstEntry=false"

    >> "%OUTPUT_FILE%" echo   {
    >> "%OUTPUT_FILE%" echo     "title": "!title!",
    >> "%OUTPUT_FILE%" echo     "src": [
    >> "%OUTPUT_FILE%" echo       {
    >> "%OUTPUT_FILE%" echo         "url": "!IMAGE_DIR!\!filename!",
    >> "%OUTPUT_FILE%" echo         "date": "!date!"
    >> "%OUTPUT_FILE%" echo       }
    >> "%OUTPUT_FILE%" echo     ],
    >> "%OUTPUT_FILE%" echo     "type": "!type!",
    >> "%OUTPUT_FILE%" echo     "description": {
    >> "%OUTPUT_FILE%" echo       "about": "",
    >> "%OUTPUT_FILE%" echo       "coding": "",
    >> "%OUTPUT_FILE%" echo       "hardware": "",
    >> "%OUTPUT_FILE%" echo       "additional": ""
    >> "%OUTPUT_FILE%" echo     }
    >> "%OUTPUT_FILE%" echo   }
)

:: Close JSON array
>> "%OUTPUT_FILE%" echo ]

echo ✅ personal_projects.json generated successfully.
pause

