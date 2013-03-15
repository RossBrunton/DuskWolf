#!/usr/bin/python

# Generates a dependancy file

# > generateDeps.py [path] [indent]
# Path is the path to (recursivley) generate dependancies for, defaults to the current directory
# Indent is the amount to indent (an integer) for pretty printing, if not specified then the file will be compressed as much as possible

import sys
import os
import posixpath
import re
import json

reqPatt = re.compile("dusk\.load\.require\(\"(.*?)\"\)")
provPatt = re.compile("dusk\.load\.provide\(\"(.*?)\"\)")
data = []

if len(sys.argv) > 1:
	os.chdir(sys.argv[1]);

for root, dirs, files in os.walk("."):
	for f in files:
		if f[-3:] == ".js":
			with open(os.path.join(root, f)) as reader:
				data.append([posixpath.join(root, f)[2:], [], []])
				for line in reader:
					for match in provPatt.finditer(line):
						data[-1][1].append(match.group(1))
					
					for match in reqPatt.finditer(line):
						data[-1][2].append(match.group(1))
				
				data[-1][1].sort()
				data[-1][2].sort()

if len(sys.argv) > 2:
	print json.dumps(data, indent=int(sys.argv[2]))
else:
	print json.dumps(data, separators=(',', ':'))
