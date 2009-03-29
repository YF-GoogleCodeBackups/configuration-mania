@echo off
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
	call :xpi
	goto EOF

:init
	goto EOF

:clean
	del chrome\%EXTENSIONNAME%.jar %EXTENSIONNAME%.xpi
	goto EOF

:jar
	cd chrome
	zip -9r %EXTENSIONNAME%.jar content locale skin -x@..\exclude.lst
	cd ..
	goto EOF

:xpi
	call :jar
	zip -9 %EXTENSIONNAME%.xpi chrome\%EXTENSIONNAME%.jar *.rdf chrome.manifest -x@exclude.lst
	goto EOF

:EOF
