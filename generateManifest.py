#!/usr/bin/python

# Generates a HTML5 manifest for offline storage

# > generateManifest.py base path [[base2 path2] ...]
# Base is a string refering to the path on the server, while path is the path of the files to list.
# This creates a list of all the files in the paths (recursivley), and adds them to the list as if they were in the base folder.

import sys
import os
import posixpath
from time import gmtime, strftime

print "CACHE MANIFEST"
print "# Updated: "+strftime("%Y-%m-%d %H:%M:%S", gmtime())

baseDir = os.getcwd()

for i in xrange(1, len(sys.argv) - 1, 2):
	print ""
	print "#Cache for "+sys.argv[i]
	
	if sys.argv[i][-1] != "/":
		sys.argv[i] += "/"
	
	os.chdir(baseDir)
	os.chdir(sys.argv[i+1])
	for root, dirs, files in os.walk("."):
		for f in files:
			if f[-1] != "~":
				print sys.argv[i]+posixpath.join(root, f)[2:]
