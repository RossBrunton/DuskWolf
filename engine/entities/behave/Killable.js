//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.Killable", (function() {
	var entities = load.require("dusk.entities");
	
	/** Gives the entity the notion of health, allows it to be damaged or healed, and terminates it when it runs out of
	 *  health.
	 * 
	 * When this entity receives a `takeDamage` behaviour event while the current mercy is 0, it will do the following:
	 * - Fire the `performDamage` behaviour event with the same object from the `takeDamage` event.
	 * - If none of the `performDamage` handlers retrurn true:
	 * -- Reduce the entity's hp by the `damage` value of the `takeDamage` event.
	 * -- If the entity has 0 hp, then terminate it.
	 * - Set the current mercy to the mercy time.
	 * 
	 * When it receives a `heal` behaviour event, the same steps are done, only using the `performHeal` event and the
	 *  `amount` proprety of the event.
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - hp:integer = 1 - The current health of the entity.
	 * - maxHp:integer = 1 - The maximum health of the entity.
	 * - mercyTime:integer = 30 - The number of frames that this entity is invincible for after being hit.
	 * - currentMercy:integer - The number of frames left until this entity can be hit again.
	 * 
	 * This is a classless behaviour.
	 */
	var Killable = {
		"hp":1,
		"maxHp":1,
		"mercyTime":30,
		"currentMercy":0,
		
		"takeDamage":function(ent, e) {
			if(isNaN(e.damage)) {
				console.warn("Tried to damage entity with NaN damage "+e.damage+".");
				return;
			}
			
			if(!ent.eProp("currentMercy")) {
				if(ent.behaviourFireWithReturn("performDamage", e).indexOf(true) === -1) {
					ent.eProp("hp", ent.eProp("hp")-e.damage);
					ent.behaviourFire("damageApplied");
					
					if(ent.eProp("hp") <= 0) {
						ent.terminate();
					}
				}
				
				ent.eProp("currentMercy", ent.eProp("mercyTime"));
			}
		},
		
		"heal":function(ent, e) {
			if(isNaN(e.amount)) {
				console.warn("Tried to heal entity with NaN "+e.amount+".");
				return;
			}
			
			if(ent.eProp("hp") >= ent.eProp("maxHp")) return;
			
			if(ent.behaviourFireWithReturn("performHeal", e).indexOf(true) === -1) {
				ent.eProp("hp", ent.eProp("hp")+e.amount);
				if(ent.eProp("hp") >= ent.eProp("maxHp")) ent.eProp("hp", ent.eProp("maxHp"));
			}
		},
		
		"frame":function(ent, e) {
			if(ent.eProp("currentMercy")) {
				ent.eProp("currentMercy", ent.eProp("currentMercy")-1);
			}
		}
	};
	
	entities.registerWorkshop("Killable", {
		"help":"Will allow the entity to be killed and damaged.",
		"data":[
			["hp", "integer", "Initial HP."],
			["maxHp", "integer", "Max HP."],
			["mercyTime", "integer", "Invincibilty frames after being hit."],
			["currentMercy", "integer", "Initial invincibility frames."],
		]
	});
	
	entities.registerBehaviour("Killable", Killable);
	
	return Killable;
})());
