//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Selection", (function() {
	var Grid = load.require("dusk.sgui.Grid");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");

	var Selection = function (parent, name) {
		Grid.call(this, parent, name);
		
		this.options = 0;
		this.orientation = c.ORIENT_VER;
		
		this._mapper.map("options", "options");
		this._mapper.map("orientation", "orientation");
		
		//Listeners
		this._populationEvent.listen((function(e) {
			if(this.orientation == c.ORIENT_HOR) {
				this.rows = 1;
				this.cols = this.options;
			}else{
				this.rows = this.options;
				this.cols = 1;
			}
			
			return e;
		}).bind(this), "before");
		
		this._populationEvent.listen(this._update.bind(this), "complete");
		this.dirPress.listen(this._update.bind(this));
	};
	Selection.prototype = Object.create(Grid.prototype);

	Selection.prototype._update = function(e) {
		if(!this.getFocused()) return false;
		if(this.orientation == c.ORIENT_HOR) {
			this.xOffset = this.getFocused().x;
			this.width = this.getFocused().width;
		}else{
			this.yOffset = this.getFocused().y;
			this.height = this.getFocused().height;
		}
	};

	Object.seal(Selection);
	Object.seal(Selection.prototype);

	sgui.registerType("Selection", Selection);
	
	return Selection;
})());
