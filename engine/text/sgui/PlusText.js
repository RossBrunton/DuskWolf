//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.PlusText", function() {
	var Group = load.require("dusk.sgui.Group");
	var sgui = load.require("dusk.sgui");
	var Label = load.require("dusk.sgui.Label");
	var c = load.require("dusk.sgui.c");
	
	/** Want to put text next to a component? Tired of messing around with labels? The new and improved
	 *  PlusText component does all that and more!
	 * 
	 * Just set the `{@link dusk.sgui.PlusText.plusType}` and `{@link dusk.sgui.PlusText.plus}` properties to the type
	 *  and data of the object you want to attach text to, and there you go! Just like that!
	 * 
	 * @extends dusk.sgui.Group
	 * @memberof dusk.text.sgui
	 * @since 0.0.20-alpha
	 */
	class PlusText extends Group {
		/** Creates a new PlusText component
		 *
		 * @param {dusk.sgui.Group} parent The container that this component is in.
		 * @param {string} name The name of the component.
		 */
		constructor(parent, name) {
			super(parent, name);
			
			//Set up components
			this.get("plus", "NullCom");
			this.get("label", "Label");
			
			/** The text that will be displayed beside the plus object. Label formatting is allowed.
			 * @type string
			 * @memberof! dusk.text.sgui.PlusText#
			 */
			this.text = "";
			/** The plus object. This is a setter for `{@link dusk.sgui.Component.ParseProps}` so setting an object here is
			 *  like calling that function.
			 * @type object
			 * @memberof! dusk.text.sgui.PlusText#
			 */
			this.plus = {};
			/** The label object. This is a setter for `{@link dusk.sgui.Component.ParseProps}` so setting an object here is
			 *  like calling that function.
			 * @memberof! dusk.text.sgui.PlusText#
			 * @type object
			 */
			this.label = {};
			/** Will display the plus component on the left of the label, instead of the right.
			 * @type boolean
			 * @default false
			 * @memberof! dusk.text.sgui.PlusText#
			 */
			this.onLeft = false;
			/** If true, then the plus component will be behind the text, rather than next to it.
			 * @type boolean
			 * @default false
			 * @memberof! dusk.text.sgui.PlusText#
			 */
			this.behind = false;
			/** The spacing between the plus and the label, in pixels.
			 * @type integer
			 * @default 2
			 * @memberof! dusk.text.sgui.PlusText#
			 */
			this.spacing = 2;
			/** The type name of the plus.
			 *  You should set this before modifying the plus itself, so that the properties are kept.
			 * @type string
			 * @default NullCom
			 * @memberof! dusk.text.sgui.PlusText#
			 */
			this.plusType = "NullCom";
			/** If true, then a click on this event will automatically go to the plus component.
			 * @type boolean
			 * @default true
			 * @since 0.0.21-alpha
			 * @memberof! dusk.text.sgui.PlusText#
			 */
			this.plusProxy = true;
			
			//Prop masks
			this._mapper.map("text", "text");
			this._mapper.map("plus", "plus", ["plusType"]);
			this._mapper.map("label", "label");
			this._mapper.map("spacing", "spacing");
			this._mapper.map("behind", "behind");
			this._mapper.map("onLeft", "onLeft");
			this._mapper.map("plusType", "plusType");
			this._mapper.map("plusProxy", "plusProxy");
			
			//Listeners
			this._onBeforePaintChildren.listen(this._obpc.bind(this));
			
			//Setup
			this.focusBehaviour = Group.FOCUS_ALL;
		}
		
		/** Called before the component is painted to update locations.
		 * @param {object} e The event object.
		 * @private
		 */
		_obpc(e) {
			var l = this.get("label");
			var p = this.get("plus");
			
			if(this.width >= 0) {
				l.width = this.width - p.width - this.spacing;
			}
			
			if(this.behind) {
				if(!l.multiline) {
					l.width = -1;
				}else{
					if(this.width >= 0) {
						l.width = this.width - this.spacing;
					}
				}
				
				p.x = 0;
				l.xOrigin = "middle";
				l.x = 0;
				
				if(this.width >= 0) p.width = this.width;
				if(this.height >= 0) p.height = this.height;
			}else if(this.onLeft) {
				p.x = 0;
				l.x = p.width + this.spacing;
			}else{
				p.x = l.width;
				l.x = 0;
			}
			
			//if(!this.height) this.height = p.height;
			//l.height = this.height;
		}
		
		/** Override to enable `{@link dusk.sgui.PlusText.plusProxy}`.
		 * 
		 * @param {object} e The interaction event.
		 * @return {boolean} The return value of the focused component's keypress.
		 */
		containerClick(e) {
			if(this.allowMouse) {
				if(!this.plusProxy) return Group.prototype.containerClick.call(this, e);
				
				if(this.get("plus").visible && !this.get("plus").clickPierce) {
					return this.get("plus").doClick(e);
				}
			}
			
			return true;
		}
		
		//Plus
		get plus() {
			return this.get("plus").bundle();
		}
		
		set plus(value) {
			this.get("plus").update(value);
			this.get("plus").alterLayer("-label");
		}
		
		//Label
		get label() {
			return this.get("label").bundle();
		}
		
		set label(value) {
			this.get("label").update(value);
			this.get("plus").alterLayer("-label");
		}
		
		//Text
		get text() {
			return this.get("label").text;
		}
		
		set text(value) {
			this.get("label").text = value;
		}
		
		//plusType
		get plusType() {
			return this.get("plus").type;
		}
		
		set plusType(value) {
			this.get("plus").type = value;
			this.get("plus").alterLayer("-label");
		}
	}
	
	sgui.registerType("PlusText", PlusText);
	
	return PlusText;
});
