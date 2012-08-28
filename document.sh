#!/bin/bash
echo "Documenting!";
jsdoc -c jsdoc.conf.json -d Doc DuskWolf -p -r -l $*;
