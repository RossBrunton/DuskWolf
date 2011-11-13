# DuskWolf #
The DuskWolf engine is basically a JSON parser; it takes a list of JSON files with special commands and runs them. What it actually does depends on what "modules" are loaded, for example there is a module for a GUI system, which registers the "actions" that it will process to create a GUI using canvas. The general idea is that everything in the game is broken down into some simple JSON instructions. Note that it used to be in Flash before, and has been ported to JavaScript.

It is mainly designed for making games, specifically RPGs, but I suppose you could hack it to work to any other use if you wanted to...

# Setting Up and Creating Documentation #
To set it up, just copy the DuskWolf folder (Containing all of the main engine), a folder containing your JSONs (Copy over "Example" if you are lazy) and load.js to your server, it can't run on your local machine, then build a normal HTML page which includes load.js and JQuery in the header, and call __start__() when the page has finished loading.
You will need to change some configs in  DuskWolf/DuskWolf.js and load.js, though!

Documentation is not complete yet, and so you can't create much documentation. Ha-ha!

# Modules #
These are modules that are currently implemented.

## Simple GUI ##
A system that allows you to create a GUI system, just using JSONs and canvas. It is broken down into "components", which are single elements of the Gui, like buttons and images. Those components can be created or accessed by nesting them inside "container" components, which then can be nested inside others and so on.
It is designed so that it is simple to set and read properties from components, all you have to do is specify the tree to the component, and read and set whatever properties you like!

# Super Interesting Legal Stuff #
This is licensed under the MIT License, see COPYING.txt for details.
Generally, you can do whatever you want with it. I'd appreciate it if you mentioned me, but you don't strictly HAVE to...
