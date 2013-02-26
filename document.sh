#!/bin/bash
echo "Documenting!";
jsdoc -c jsdoc.conf.json -d Doc -r $*;
echo "Documenting finished, have a nice day!"
