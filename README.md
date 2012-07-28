# DuskWolf #
The DuskWolf engine is basically a JSON parser; it takes a list of JSON files with special commands and runs them. What it actually does depends on what "modules" are loaded, for example there is a module for a GUI system, which registers the "actions" that it will process to create a GUI using canvas. The general idea is that everything in the game is broken down into some simple JSON instructions. Note that it used to be in Flash before, and has been ported to JavaScript.

It is mainly designed for making games, specifically RPGs and platformers, but I suppose you could hack it to work to any other use if you wanted to...

You can see an example at http://www.savagewolf.org/games/duskWolf .

See the wiki in the tab bar above for information about... Stuff.

# Supported Platforms #
The recommended platform is Firefox, in Chrome the images are blurry, but other than that no issues. If you want to use IE, version 9 or higher should work, but don't count on it...

# Setting up #
(Note: This is out of date, you can check the GitHub wiki if I've put something on there yet)

## Installing ##
This engine needs several things to run it. I will now guide you through them, and assume that you are setting it up in a folder on a webserver named MyFolder, because you are very possesive of folders.

First is the engine itself, this is the thing in the "DuskWolf" folder, so put that in MyFolder.
Second, you need a game for the engine to play, the example ones are in the "Data" folder, so put that somewhere. It can be anywhere, really, but for convenience lets just put it in MyFolder.
Third is jquery, which you can download from http://jquery.com/ , just plop it in MyFolder, and leave it.
Fourth, you need Google Closure, first create a repo for it using http://code.google.com/p/closure-library/source/checkout , make sure it's outside this git one, because there may be problems. Then, inside that repo is a folder named "closure", go ahead and copy it into MyFolder.
And last, you need an actual page for you to put the game on! There is a file named "DuskWolf.html" in this repo, which is a bare-bones file to show you how it's done.

In that file, notice there are two main "parts" to the head tag. The first is a script tag containing basic config vars, and a jquery script tag. The config vars are discussed in a minute. Below that are two seperate groups of script tags one of them must always be commented. Uncomment the top one if you want to run it uncompiled, which I'm pretty sure you do at this point.

## Configuring ##
Most configuring of the engine itself (I'll discuss the game later) is done in the head tag things I described earlier.

## Creating Documentation ##
To set it up, just copy the DuskWolf folder (Containing all of the main engine), a folder containing your JSONs (Copy over "Example" if you are lazy) and load.js to your server, it can't run on your local machine, then build a normal HTML page which includes load.js and JQuery in the header, and call __start__() when the page has finished loading.

You will want to see the default and example files until I get around to making a user guide.

However, if you want, it is really easy to create a simple HTTP server on localhost, just cd into the folder, and run "$python -m SimpleHTTPServer", then navigate to 127.0.0.1:8000, good ol' python. Note that this server will be public, so if anyone wanted, they could also connect to that HTTP server.

Documentation is not complete yet, and so you can't create much documentation. Ha-ha!



# Modules #
These are modules that are currently implemented.

## Simple GUI ##
A system that allows you to create a GUI system, just using JSONs and canvas. It is broken down into "components", which are single elements of the Gui, like buttons and images. Those components can be created or accessed by nesting them inside "container" components, which then can be nested inside others and so on.
It is designed so that it is simple to set and read properties from components, all you have to do is specify the tree to the component, and read and set whatever properties you like!

## Plat ##
A basic platformer engine, currently incomplete.

## Local Saver ##
Just a basic saving and loading thing. You can save vars to the JavaScript session storage thing using a RegExp, nothing much.

# Super Interesting Legal Stuff #
This is licensed under the MIT License, see COPYING.txt for details.
Generally, you can do whatever you want with it. I'd appreciate it if you mentioned me, but you don't strictly HAVE to...

# FLattr #
Here is a Flattr button, bask in it's awe.

[![Flattr this git repo](http://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=SavageWolf&url=https://github.com/SavageWolf/DuskWolf&title=DuskWolf&language=en_GB&tags=github&category=software)
