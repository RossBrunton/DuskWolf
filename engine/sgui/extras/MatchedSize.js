//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.extras.MatchedSize", function() {
	var Extra = load.require("dusk.sgui.extras.Extra");
	var sgui = load.require("dusk.sgui");
	
	/** A dynamic width component changes it's width depending on the value of a range.
	 * 
	 * The width is changed to value between the `min` and `max` properties. The higher the value, the closer the range
	 *  is to the `max` value.
	 * 
	 * @memberof dusk.sgui.extras
	 * @extends dusk.sgui.extras.Extra
	 */
	class MatchedSize extends Extra {
		/** Creates a new MatchedSize extra.
		 * 
		 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
		 * @param {string} name This extra's name.
		 */
		constructor(owner, name) {
			super(owner, name);
		
			this.base = "";
			this.paddingTop = 0;
			this.paddingBottom = 0;
			this.paddingLeft = 0;
			this.paddingRight = 0;
			
			this._matchFrameId = this._owner.frame.listen(this._matchFrame.bind(this));
			this.onDelete.listen(this._matchDeleted.bind(this));
			
			//Prop masks
			this._props.map("base", "base");
			this._props.map("paddingTop", "paddingTop");
			this._props.map("paddingBottom", "paddingBottom");
			this._props.map("paddingLeft", "paddingLeft");
			this._props.map("paddingRight", "paddingRight");
		}
		
		_matchFrame(e) {
			if(!this.base) return;
			
			var t = this._owner.path(this.base);
			
			if(!t) return;
			
			this._owner.visible = t.visible;
			
			this._owner.x = t.x - this.paddingTop;
			this._owner.y = t.y - this.paddingLeft;
			
			this._owner.height = this.paddingTop + this.paddingBottom + t.getRenderingHeight();
			this._owner.width = this.paddingLeft + this.paddingRight + t.getRenderingWidth();
		}
		
		_matchDeleted(e) {
			this._owner.frame.unlisten(this._matchFrameId);
		}
	}
	
	sgui.registerExtra("MatchedSize", MatchedSize);
	
	return MatchedSize;
});
