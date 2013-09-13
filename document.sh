#!/bin/bash
echo "Documenting!";
jsdoc DuskWolf docIndex.md -c jsdoc.conf.json -d Doc -r $*;
echo "Documenting finished, have a nice day!"
