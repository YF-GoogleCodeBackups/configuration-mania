EXTENSIONNAME=confmania

all: clean build

build: init $(EXTENSIONNAME).xpi

init:
	find . -type f -exec chmod 0644 {} \;

clean:
	rm -f $(EXTENSIONNAME).xpi

$(EXTENSIONNAME).xpi:
	zip -9qr $(EXTENSIONNAME).xpi \
		chrome/content chrome/skin chrome/locale \
		*.rdf chrome.manifest \
		bootstrap.js \
		lib/*.js \
		defaults/preferences/pref.js \
		-x@exclude.lst
#		components \
	chmod 0644 $(EXTENSIONNAME).xpi

# Joke
love:
	@echo "`basename $(MAKE)`: Don't know how to make love. Stop."
