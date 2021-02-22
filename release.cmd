@echo off
set VER=2.1.6

sed -i -E "s/version>.+?</version>%VER%</" install.rdf
sed -i -E "s/version>.+?</version>%VER%</; s/download\/.+?\/speed-start-.+?\.xpi/download\/%VER%\/speed-start-%VER%\.xpi/" update.xml

set XPI=speed-start-%VER%.xpi
if exist %XPI% del %XPI%
zip -r9q %XPI% * -x .git/* .gitignore update.xml LICENSE README.md *.cmd *.xpi *.exe
