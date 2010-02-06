EXTENSIONNAME=confmania

all: clean build

build: init $(EXTENSIONNAME).xpi

init:
	find . -type f -exec chmod 0644 {} \;

clean:
	rm -f chrome/$(EXTENSIONNAME).jar $(EXTENSIONNAME).xpi

chrome/$(EXTENSIONNAME).jar:
	cd chrome ; \
	zip -9qr $(EXTENSIONNAME).jar \
		content locale skin -x@../exclude.lst ; \
	cd ..

$(EXTENSIONNAME).xpi: chrome/$(EXTENSIONNAME).jar
	zip -9q $(EXTENSIONNAME).xpi \
		chrome/$(EXTENSIONNAME).jar \
		*.rdf chrome.manifest \
		defaults/preferences/pref.js \
		-x@exclude.lst
#		components \
	chmod 0644 $(EXTENSIONNAME).xpi
