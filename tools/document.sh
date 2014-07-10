#!/bin/bash
echo "Documenting!";
jsdoc DuskWolf tools/docIndex.md -c tools/jsdoc.conf.json -d Doc -r $*;
echo "Documenting finished, have a nice day!"
