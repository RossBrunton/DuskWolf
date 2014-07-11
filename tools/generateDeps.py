#!/usr/bin/python

# Generates a dependancy file

# > generateDeps.py [path] [obj] [indent]
# Path is the path to (recursivley) generate dependancies for, defaults to the current directory
# Obj will be merged with the dependancies, and any properties on it will be present in the exported file.
# Indent is the amount to indent (an integer) for pretty printing,
#  if not specified then the file will be compressed as much as possible

import sys
import os
import posixpath
import re
import json

reqPatt = re.compile("(?:dusk\.)?load\.require\(\"(.*?)\"(?:,.*)?\)")
provPatt = re.compile("(?:dusk\.)?load\.provide\(\"(.*?)\"")
data = []

if len(sys.argv) > 1:
	os.chdir(sys.argv[1]);

for root, dirs, files in os.walk("."):
	for f in files:
		if f[-3:] == ".js":
			with open(os.path.join(root, f)) as reader:
				data.append([posixpath.join(root, f)[2:], [], [], 0])
				for line in reader:
					for match in provPatt.finditer(line):
						data[-1][1].append(match.group(1))
					
					for match in reqPatt.finditer(line):
						data[-1][2].append(match.group(1))
				
				data[-1][3] = os.path.getsize(os.path.join(root, f));
				data[-1][1].sort()
				data[-1][2].sort()

export = {"version":1, "packages":data}
if len(sys.argv) >= 3:
	export.update(json.loads(sys.argv[2]))

if len(sys.argv) > 3:
	print json.dumps(export, indent=int(sys.argv[3]))
else:
	print json.dumps(export, separators=(',', ':'))
