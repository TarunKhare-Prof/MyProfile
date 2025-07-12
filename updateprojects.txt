@echo off
setlocal EnableDelayedExpansion

:: Configuration
set "IMAGE_DIR=images"
set "OUTPUT_FILE=data\personal_projects.json"

:: Supported extensions
set "VIDEO_EXT=.mp4 .webm .ogg"
set "IMAGE_EXT=.jpg .jpeg .png .gif"

:: Start JSON structure
echo {> %OUTPUT_FILE%
echo   "title": "Personal Projects",>> %OUTPUT_FILE%
echo   "projects": [>> %OUTPUT_FILE%

set "firstEntry=true"

:: Loop through files in /images
for %%F in (%IMAGE_DIR%\*) do (
    set "filename=%%~nxF"
    set "name=%%~nF"
    set "ext=%%~xF"
    set "src=%%F"

    :: Determine type
    set "type=image"
    for %%V in (%VIDEO_EXT%) do (
        if /I "%%~xF"=="%%V" set "type=video"
    )

    :: Format title from file name (remove _, capitalize)
    set "title=!name:_= !"
    for %%C in (!title!) do (
        set "word=%%C"
        set "titleFormatted=!titleFormatted! %%~C"
    )

    :: Handle commas
    if "!firstEntry!"=="false" echo ,>> %OUTPUT_FILE%
    set "firstEntry=false"

    >> %OUTPUT_FILE% echo     {
    >> %OUTPUT_FILE% echo       "title": "!name:_= !",
    >> %OUTPUT_FILE% echo       "type": "!type!",
    >> %OUTPUT_FILE% echo       "src": "!src:\=\\!",
    >> %OUTPUT_FILE% echo       "description": ""
    >> %OUTPUT_FILE% echo     }
)

:: Close JSON
echo   ]>> %OUTPUT_FILE%
echo }>> %OUTPUT_FILE%

echo ✅ personal_projects.json generated successfully.
pause
