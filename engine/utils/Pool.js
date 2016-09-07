//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.utils.Pool", function() {
	var dusk = load.require("dusk");
	
	/** Object pools, for static memory allocation.
	 * 
	 * Objects are taken from this pool when allocated, and returned when freed. This means that the object that is
	 *  allocated is not a new one, but it cuts down on memory allocations and garbadge collection.
	 * 
	 * @memberof dusk.utils
	 * @since 0.0.21-alpha
	 */
	class Pool {
		/** Creates a new object pool
		 * 
		 * @param {class} constructor The constructor for the object in the pool.
		 * @param {?function(*, *):*} onAlloc Called with the object and specified arguments every time the object is
		 *  allocated. This should return the object to allocate.
		 * @param {?function(*):*} onFree Called when the object is freed; should return the object to return to the
		 *  pool.
		 * @since 0.0.21-alpha
		 */
		constructor(constructor, onAlloc, onFree) {
			this._constructor = constructor;
			this._onAlloc = onAlloc?onAlloc:null;
			this._onFree = onFree?onFree:null;
			
			this._inPool = 0;
			this._objects = [];
			this.inWild = 0;
			this._mlWarning = false;
		}
		
		/** Allocates an object from this pool.
		 * @param {?*} args The first argument to the `onAlloc` function.
		 * @return {*} The object that was alocated, please return it later.
		 */
		alloc(args) {
			this.inWild ++;
			
			if(this.inWild > 0xfff && !this._mlWarning) {
				console.log("**** MEMORY LEAK WARNING ****");
				console.log(this);
				this._mlWarning = true;
			}
			
			if(this._inPool == 0) {
				var o = new this._constructor();
				return this._onAlloc?this._onAlloc(o, args):o;
			}else{
				this._inPool --;
				return this._onAlloc?this._onAlloc(this._objects[this._inPool], args):this._objects[this._inPool];
			}
		}
		
		/** Frees a previously allocated object. 
		 * @param {*} object The allocated object.
		 */
		free(object) {
			this._inPool ++;
			this.inWild --;
			
			if(dusk.dev) {
				// Check pool for double frees
				for(var i = 0; i < this._inPool-1; i ++) {
					// Less than becasue we already have incremented the value
					if(this._objects[i] == object) {
						throw new Pool.DoubleFreeError();
					}
				}
			}
			
			if(this._onFree) object = this._onFree(object);
			this._objects[this._inPool-1] = object;
		}
	}
	
	/** Exception raised on double free.
	 * @extends Error
	 * @since 0.0.21-alpha
	 * @memberof dusk.utils.Pool
	 */
	class DoubleFreeError extends Error {
		constructor() {
			super();
			
			this.name = "DoubleFreeError";
			this.message = "Pool.free() called on same object multiple times";
		}
	}
	Pool.DoubleFreeError = DoubleFreeError;
	
	return Pool;
});
