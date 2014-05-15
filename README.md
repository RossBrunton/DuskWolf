## DuskWolf ##
The DuskWolf engine is basically a game engine thing; a collection of libraries to help me make games.

It is mainly designed for RPGs and platformers, but it should work for pretty much any 2D game in theory.

## Installing and Running ##
Clone the repo to somewhere:
> git clone https://github.com/RossBrunton/DuskWolf.git DuskWolf

Enter that folder
> cd DuskWolf

Generate the dependency files:
> make

Start a HTTP server (or put all the files in web root or wherever):
> python -m SimpleHTTPServer

And then navigate to `127.0.0.1:8000` in a web browser.

## Documentation ##
The code is documented using JSDoc 3.2.

You can read it in the source code, which is what I do, or you can generate HTML documentation using:
> make document

Or, to view private members:
> make documentPrivate

## Super Interesting Legal Stuff ##
This is licensed under the MIT License, see COPYING.txt for details.
Generally, you can do whatever you want with it. I'd appreciate it if you mentioned me, however.

## Contributing ##
I'm afraid this is a rather personal project, so I probably won't accept any pull requests or anything.
Feel free to fork it and make your own changes, if for some reason you want to do that, though.

## Flattr ##
Here is a Flattr button, bask in it's awe.

[![Flattr this git repo](http://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=SavageWolf&url=https://github.com/RossBrunton/DuskWolf&title=DuskWolf&language=en_GB&tags=github&category=software)
