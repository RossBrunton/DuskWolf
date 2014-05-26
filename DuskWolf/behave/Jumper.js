//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Jumper", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var skills = load.require("dusk.skills");
	var c = load.require("dusk.sgui.c");
	
	var Jumper = function(entity) {
		Behave.call(this, entity);
		
		this._jumps = 0;
		this._jumping = 0;
		this._jumpReleased = false;
		
		this.entityEvent.listen(this._jumpFrame.bind(this), "frame");
		
		this.entityEvent.listen((function(e) {
			this._jumps = 0;
			this._jumping = 0;
		}).bind(this), "collide", {"dir":c.DIR_DOWN});
		
		this.entityEvent.listen((function(e) {
			this._jumping = 0;
		}).bind(this), "collide", {"dir":c.DIR_UP});
	};
	Jumper.prototype = Object.create(Behave.prototype);

	Jumper.prototype._jumpFrame = function(e) {
		if(this._controlActive("jump")) {
			if(this._jumpReleased && ((this._entity.touchers(c.DIR_DOWN).length && skills.hasSkill("jump"))
			|| (this._jumps == 0 && skills.hasSkill("dubjump"))
			|| skills.hasSkill("infinijump"))) {
				this._entity.applyDy("control_jump", -15, 15, 1, 0);
				if(!this._entity.touchers(c.DIR_DOWN).length) {
					this._jumps ++;
					this._entity.performAnimation("airjump");
				}else{
					this._entity.performAnimation("groundjump");
				}
				
				this._jumping = 10;
				this._jumpReleased = false;
			}else if(this._jumping) {
				this._entity.applyDy("control_jump", -15, 15, 1, 0);
				this._jumping --;
			}
		}else{
			//this._entity.applyDy("control_jump", 0);
			this._jumping = 0;
			this._jumpReleased = true;
		}
	};

	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	Jumper.workshopData = {
		"help":"Will jump on input.",
		"data":[
			
		]
	};

	Object.seal(Jumper);
	Object.seal(Jumper.prototype);

	entities.registerBehaviour("Jumper", Jumper);
	
	return Jumper;
})());
