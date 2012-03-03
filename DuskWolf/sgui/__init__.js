//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

window.sgui = {"Component":"Component",
"NullCom":"Component",
"IContainer":"IContainer",
"Group":"Group",
"Pane":"Pane",
"Rect":"Rect",
"Image":"Image",
"FocusChecker":"FocusChecker",
"HMenu":"Menu",
"VMenu":"Menu",
"Single":"Single",
"DirListener":"DirListener",
"Grid":"Grid",
"Label":"Label",
"Tile":"Tile",
"DecimalTile":"DecimalTile",
"TileMap":"TileMap",
"Saybox":"Saybox",
"PlatMain":"PlatMain",
"PlatEntity":"PlatEntity",
"PlatHero":"PlatEntity"
};

window.loadComponent = function(name) {
	if(typeof(sgui[name]) != "string") return;
	__import__("sgui/"+sgui[name]+".js");
};
