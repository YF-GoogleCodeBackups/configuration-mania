@rem @echo off
set EXTENSIONNAME=confmania

if "%1" == "all"	call :all
if "%1" == "clean"	call :clean
if "%1" == "build"	call :build
if "%1" == "jar"	call :jar
if "%1" == "xpi"	call :xpi

goto EOF

:all
	call :clean
	call :build
	goto EOF

:build
	call :init
	call :prep
	call :xpi
	goto EOF

:prep
	if exist "%ProgramFiles%\7-Zip\7z.exe" (
		set ZIP_PROG="%ProgramFiles%\7-Zip\7z.exe" a -tzip -mx=9
	) else (
		set ZIP_PROG=zip -9
	)

:init
	goto EOF

:clean
	del %EXTENSIONNAME%.xpi
	goto EOF

:xpi
	call :prep
	%ZIP_PROG% %EXTENSIONNAME%.xpi chrome\content chrome\skin chrome\locale *.rdf chrome.manifest bootstrap.js lib\*.js -x@exclude.lst
	goto EOF

:EOF
