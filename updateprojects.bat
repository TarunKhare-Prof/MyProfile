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

:: Loop through files
for %%F in (%IMAGE_DIR%\*) do (
    set "filename=%%~nxF"
    set "name=%%~nF"
    set "ext=%%~xF"
    set "src=%%F"
    set "type=image"

    :: Determine if it's a video
    for %%V in (%VIDEO_EXT%) do (
        if /I "%%~xF"=="%%V" (
            set "type=video"
        )
    )

    :: Format title (replace _ with space)
    set "title=!name:_= !"

    :: Convert backslashes to forward slashes for web compatibility
    set "src=!src:\=/!"

    :: Handle comma before entry
    if not "!firstEntry!"=="true" >> "%OUTPUT_FILE%" echo ,
    set "firstEntry=false"

    :: Write project entry
    >> "%OUTPUT_FILE%" echo   {
    >> "%OUTPUT_FILE%" echo     "title": "!title!",
    >> "%OUTPUT_FILE%" echo     "media": ["!src!"],
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
