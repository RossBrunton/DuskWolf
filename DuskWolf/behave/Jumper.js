//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");
dusk.load.require("dusk.skills");

dusk.load.provide("dusk.behave.Jumper");

dusk.behave.Jumper = function(entity) {
	dusk.behave.Behave.call(this, entity);
	
	this._jumps = 0;
	this._jumping = 0;
	this._jumpReleased = false;
	
	this.entityEvent.listen(this._jumpFrame, this, {"name":"frame"});
	this.entityEvent.listen(function(e) {
		this._jumps = 0;
		this._jumping = 0;
	}, this, {"name":"collide", "dir":dusk.sgui.c.DIR_DOWN});
	this.entityEvent.listen(function(e) {
		this._jumping = 0;
	}, this, {"name":"collide", "dir":dusk.sgui.c.DIR_UP});
};
dusk.behave.Jumper.prototype = Object.create(dusk.behave.Behave.prototype);

dusk.behave.Jumper.prototype._jumpFrame = function(e) {
	if(this._controlActive("jump")) {
		if(this._jumpReleased && ((this._entity.touchers(dusk.sgui.c.DIR_DOWN).length && dusk.skills.hasSkill("jump"))
		|| (this._jumps == 0 && dusk.skills.hasSkill("dubjump"))
		|| dusk.skills.hasSkill("infinijump"))) {
			this._entity.applyDy("control_jump", -15, 15, 1, 0);
			if(!this._entity.touchers(dusk.sgui.c.DIR_DOWN).length) {
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
dusk.behave.Jumper.workshopData = {
	"help":"Will jump on input.",
	"data":[
		
	]
};

Object.seal(dusk.behave.Jumper);
Object.seal(dusk.behave.Jumper.prototype);

dusk.entities.registerBehaviour("Jumper", dusk.behave.Jumper);
