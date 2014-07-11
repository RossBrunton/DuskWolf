#!/usr/bin/python

""" A Python implementation of Load.js.

See Load.js's documentation for more details on what many of the properties do, as well as how the system works. This
module provides many methods of that package in Python with the same names and signatures.
"""

import os
import re
import json

class LoadState():
    """ Represents a "state" of packages being imported.
    
    LoadStates can have packages imported, when those packages are imported, all future importing will not import it
    again.
    
    Functions can be registered when a package is provided or a file is loaded. These will only be fired once
    for each package/file. Unless it has been cleared. These are called when Load.js would provide or append a file to
    head. But you have to provide your own functions. Of course.
    """
    
    _importSet = [];
    """ The set of all package names that need to be imported. """
    _batchSet = [];
    """ The set of package names that are in the current "import batch" and will be loaded soon. """
    _states = {};
    """ Key is package name, value is 0 for not imported, and 1 for imported. """
    _readies = {};
    """ Key is package name, value is an array of functions that will be called when the package is imported. """
    _provideCount = 0;
    """ How many packages still need imported. """
    _batching = False;
    """ Whether we are currently importing packages. """
    
    onProvide = None
    """ Function to call when a package is provided.
    
    Given a single argument, which is the name of the package.
    """
    onFileProvide = None
    """ Function to call when a file containing a package is to be loaded.
    
    It is given two arguments, first is the path, second is a boolean indicating whether the path is a file path or else
    a URL.
    """
    skipLoad = False
    """ If true then the package "load" will never be imported, and silently ignored. """
    skipUnknown = False
    """ If true then any package which is not found will be silently ignored, rather than causing an error. """
    
    def _provide(self, name):
        """ Provides a package.
        
        Called when the file is "added", since no JS code actually runs.
        """
        self._states[name] = 2;
        
        if name in self._readies:
			for r in self._readies[name]:
				r(name);
        
        self._provideCount -= 1;
        #if not self._provideCount and self._batching:
        #    self._doBatchSet();
        
        if self.onProvide and (name != "load" or not self.skipLoad):
            self.onProvide(name)
    
    def importPackage(self, name, onReady=None):
        """ Imports a package, calling the onProvide and onFileProvide functions as appropriate.
        
        If onReady is provided, it will be called with the package name when it is finally imported.
        """
        if not self.isImported(name):
            self._addToImportSet(name);
            
            if not self._batching:
                self._batching = True;
                self._doBatchSet();
            
            if name[0] == ">":
                name = name[1:];
            
            if onReady:
                if name not in self._readies:
                    self._readies[name] = [];
                self._readies[name].append(onReady);
            
            return None;
        else:
            if name[0] == ">":
                name = name[1:];
            
            if onReady:
                onReady(name);
            
            return name;
    
    def importAll(self):
        """ Imports all known packages. """
        for p in _names.keys():
            self.importPackage(p)
    
    def importMatch(self, regex):
        """ Imports all packages that match a given regex. """
        for p in _names.keys():
            if regex.match(p):
                self.importPackage(p)
    
    def isImported(self, name):
        """ Returns whether a given package is imported. """
        if name in self._states and self._states[name] == 2:
            return True;
        
        return False;
    
    def _addToImportSet(self, pack):
        """ Adds a given package to the import set. """
        if pack in self._importSet:
            return
        
        if pack not in _names:
            print pack + " required but not found."
            return
        
        if pack in self._states and self._states[pack] != 0:
            return
        
        self._importSet.append(pack);
        p = _names[pack];
        
        for d in p[2]:
            if d[0] == ">":
                self._addToImportSet(d[1:])
            elif d[0] == "@":
                self._importSet.append(d)
            else:
                self._addToImportSet(d)

    def _doBatchSet(self, trace=False):
        """ Performs the batching stage; calculating all the packages that can currently be imported without additional
        dependancies. """
        if not self._importSet:
            self._batching = False;
            return;
        
        self._batchSet = [];
        
        #Generate the batch set
        i = 0;
        while i < len(self._importSet):
            if self._importSet[i][0] == "@":
                self._batchSet.append(self._importSet[i])
                self._importSet.remove(self._importSet[i])
                i -= 1;
                continue;
            
            now = _names[self._importSet[i]];
            
            okay = True;
            for d in now[2]:
                if d[0] == ">":
                    #Okay
                    pass
                elif d[0] == "@":
                    #Also Okay
                    pass
                elif d not in _names:
                    if self.skipUnknown:
                        pass
                    else:
                        print now[0] + " depends on "+d+", which is not available."
                        okay = False
                    break;
                elif d not in self._states or self._states[d] < 2:
                    # Check if they are from the same file
                    if _names[d][0] != now[0]:
                        okay = False;
                        if trace:
                            print now[0] +" blocked by "+_names[d][0]
                        
                        break;
            
            if okay:
                if (self._importSet[i] in self._states and self._states[self._importSet[i]] == 0)\
                or self._importSet[i] not in self._states:
                    self._batchSet.append(self._importSet[i])
                
                self._importSet.remove(self._importSet[i])
                i -= 1
            
            i += 1
        
        #Check for errors
        if not self._batchSet and not trace:
            print "Dependency problem!"
            self._doBatchSet(True)
            return;
        elif not self._batchSet:
            return;
        
        for i in self._batchSet:
            if i[0] == "@":
                self._doImportFile(i);
            else:
                self._doImportFile(_names[i][0]);
        
        if not self._provideCount:
            self._doBatchSet();
    
    def _doImportFile(self, file):
        """ Simulates appending a file to the head tag and provides packages. """
        remote = False
        if file[0] == "@":
            file = file[1:]
            remote = True
        
        if file not in _files:
            _files[file] = [[], [], False];
        
        f = _files[file];
        
        self._provideCount += len(f[0]);
        
        for i in f[0]:
            self._states[i] = 1;
            self._provide(i)
        
        if self.onFileProvide and (not self.skipLoad or "load" not in f[0]):
            self.onFileProvide(file, remote)
    
    def abort(self):
        """ Stops any currently running import. """
        self._batching = False;
        self._importSet = [];
        self._batchSet = [];
    
    def clear(self):
        """ Resets all the packages, as if none had been imported at all. """
        self.abort()
        self._states = []


_names = {};
""" Package information as per _names in Load.js. """
_files = {};
""" File information as per _files in Load.js. """

def addDependency(file, provided, required, size):
    """ Adds a new dependancy.
    
    Will be visible immediately to all LoadStates. """
    if not size:
        size = 0;
    
    for p in provided:
        if p not in _names\
        or (_names[p][1] == 0 and len(provided > _files[_names[p][0]][0].length))\
        or (_names[p][1] == 0 and size < _names[p][3]):
            _names[p] = [file, 0, required, size, None, []];
    
    _files[file] = [provided, required, False];

def importList(path, callback=None, errorCallback=None):
    """ Given a path to a dependancy file, loads the dependancies of that file. """
    try:
        relativePath = os.path.split(path)[0]
        
        data = json.load(file(path))
        
        try:
            data["version"]
        except TypeError:
            #Convert into new format
            data = {"version":0, "packages":data}
        
        for p in data["packages"]:
            if "://" not in p[0] and not os.path.isabs(p[0]):
                p[0] = os.path.join(relativePath, p[0]);
                
            addDependency(p[0], p[1], p[2], p[3]);
        
        if callback:
            callback(data)
        
    except Exception as e:
        if errorCallback:
            errorCallback(e)
        else:
            raise e
