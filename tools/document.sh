#!/bin/bash
echo "Documenting!";
jsdoc DuskWolf Tools/docIndex.md -c Tools/jsdoc.conf.json -d Doc -r $*;
echo "Documenting finished, have a nice day!"
