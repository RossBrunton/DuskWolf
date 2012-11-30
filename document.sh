#!/bin/bash
echo "Documenting!";
jsdoc -c jsdoc.conf.json -d Doc DuskWolf -r -l $*;
