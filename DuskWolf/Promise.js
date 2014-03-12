//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

//This is a polyfill for Promise; it is imported if Promise is not supported

//If we are here, assume that any Promise already on window is inadequate
if("Promise" in window) {
	delete window.Promise;
}

window.Promise = function(promise) {
	this.state = Promise.STATE_PENDING;
	
	this._handlers = [];
	
	this.value = undefined;
	
	promise((function(value){
		this.value = value; this.state = Promise.STATE_FULFILLED; this._update();
	}).bind(this), (function(value){
		this.value = value; this.state = Promise.STATE_REJECTED; this._update();
	}).bind(this))
};

window.Promise.prototype.then = function(onFullfilled, onRejected) {
	var prom = new Promise((function(fullfill, reject) {
		// ???
	}).bind(this));
	
	this._handlers.push([prom, onFullfilled, onRejected]);
	setTimeout(this._update.bind(this), 1);
	return prom;
};

window.Promise.prototype.set = function(value, state) {
	this.state = state;
	this.value = value;
	
	this._update();
};

window.Promise.prototype.catch = function(onRejected) {
	this.then(undefined, onRejected);
};

window.Promise.prototype._update = function() {
	if(this.state == Promise.STATE_PENDING) return;
	
	for(var i = 0; i < this._handlers.length; i ++) {
		if(this.state == Promise.STATE_FULFILLED) {
			if(this._handlers[i][1]) {
				this._handlers[i][0].set(this._handlers[i][1](this.value), Promise.STATE_FULFILLED);
			}else{
				this._handlers[i][0].set(this.value, Promise.STATE_FULFILLED);
			}
		}else if(this.state == Promise.STATE_REJECTED) {
			if(this._handlers[i][2]) {
				this._handlers[i][0].set(this._handlers[i][2](this.value), Promise.STATE_REJECTED);
			}else{
				this._handlers[i][0].set(this.value, Promise.STATE_REJECTED);
			}
		}
	}
	
	this._handlers = [];
};

window.Promise.STATE_PENDING = 0;
window.Promise.STATE_FULFILLED = 1;
window.Promise.STATE_REJECTED = 2;

window.Promise.resolve = function(value) {
	return new Promise(function(fullfill, reject) {fullfill(value);});
};

window.Promise.reject = function(reason) {
	return new Promise(function(fullfill, reject) {reject(value);});
};

window.Promise.cast = function(value) {
	if(["object", "function"].indexOf(typeof value) != -1 && "then" in value) {
		return value;
	}else{
		return Promise.resolve(value);
	}
};

window.Promise.castReject = function(value) {
	if(["object", "function"].indexOf(typeof value) != -1 && "then" in value) {
		return value;
	}else{
		return Promise.reject(value);
	}
};

window.Promise.all = function(promises) {
	return new Promise(function(fullfill, reject) {
		var promiseCount = promises.length;
		var promiseValues = Array(promises.length);
		
		for(var i = 0; i < promises.length; i ++) {
			promises[i].then((function(i, value) {
				promiseCount --;
				promiseValues[i] = value;
				
				if(promiseCount == 0) {
					fullfill(promiseValues);
				}
			}).bind(undefined, i), reject); //If rejected, promiseCount will not go down
		}
	});
};

window.Promise.race = function(promises) {
	return new Promise(function(fullfill, reject) {
		var complete = false;
		
		for(var i = 0; i < promises.length; i ++) {
			promises[i].then(function(value) {
				if(!complete) {
					fullfill(value);
				}
				
				complete = true;
			}, function(value){});
		}
	});
};
