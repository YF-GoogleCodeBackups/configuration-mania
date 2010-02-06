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
	del chrome\%EXTENSIONNAME%.jar %EXTENSIONNAME%.xpi
	goto EOF

:jar
	call :prep
	cd chrome
	%ZIP_PROG% -r %EXTENSIONNAME%.jar content locale skin -x@..\exclude.lst
	cd ..
	goto EOF

:xpi
	call :prep
	call :jar
	%ZIP_PROG% %EXTENSIONNAME%.xpi chrome\%EXTENSIONNAME%.jar *.rdf chrome.manifest -x@exclude.lst
	goto EOF

:EOF
