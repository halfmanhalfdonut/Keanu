var Keanu; // Whoa
(function() {
	var INTERVAL_TIME = 10; // 10ms between each interval

	/*	Keanu constructor (new Keanu())
	 *	@id - String - DOM element ID for desired canvas object
	 *	returns Keanu object
	 */
	Keanu = function(id) {
		if (!id) return false;
		
		this.canvas = document.getElementById(id);
		this.ctx = this.canvas.getContext('2d');
		this.interval = null;
		this.checkTimer = null;
		this.triggering = false;
		this.subscribers = {};
		this.checkedDimensions = false;
		this.clearX = 0;
		this.clearY = 0;
		this.clearW = this.canvas.width;
		this.clearH = this.canvas.height;

		return this;
	};

	// Optional modules namespace for external modules
	Keanu.modules = {};

	// Keanu prototype
	Keanu.prototype = {
		constructor: Keanu,
		/*	Keanu.subscribe()
		 *	@type - String - event type
		 *	@listener - Function - callback fired when this event is triggered
		 *	@zIndex - Number - z-index of anything animated within the provided callback
		 */
		subscribe: function(type, listener, zIndex) {
			zIndex = zIndex || 0;
			if (typeof this.subscribers[type] == "undefined") {
		        this.subscribers[type] = [];
		    }
		    if (typeof this.subscribers[type][zIndex] == "undefined") {
		    	this.subscribers[type][zIndex] = [];
		    }
		    this.subscribers[type][zIndex].push(listener);
			if (!this.interval) this.start();
		},
		/*	Keanu.unsubscribe()
		 *	@type - String - event type
		 *	@listener - Function - callback
		 *	@zIndex - Number - z-index on the animation stack
		 */
		unsubscribe: function(type, listener, zIndex) {
			var self = this;
			// use zIndex if they send it in
			if (zIndex != undefined) {
				if (this.subscribers[type] instanceof Array) {
					if (this.subscribers[type][zIndex] instanceof Array) {
						var subscribers = this.subscribers[type][zIndex];
						for (var i = 0, len = subscribers.length; i < len; i += 1) {
						    if (subscribers[i] === listener) {
						        subscribers.splice(i, 1);
						        break;
						    }
						}
					}
				}
			// otherwise check all subscribers
			} else {
				if (this.subscribers[type] instanceof Array) {
					var subscribers = this.subscribers[type];
					for (var i = 0, len = subscribers.length; i < len; i += 1) {
						if (subscribers[i] instanceof Array) {
							var sub = subscribers[i];
							for (var j = 0, gth = sub.length; j < gth; j += 1) {
								if (sub[j] === listener) {
									sub.splice(j, 1);
									break;
								}
							}
						} else {
							if (subscribers[i] === listener) {
								subscribers.splice(i, 1);
								break;
							}
						}
					}
				}
			}
			clearTimeout(this.checkTimer);
			this.checkTimer = setTimeout(function() {
				if (self.isEmpty(self.subscribers)) {
					self.stop();
				}
			}, 100);
			
		},
		/*	Keanu.trigger()
		 *	@event - String - event type
		 *	Fires a given event if a given event exists
		 */
		trigger: function(event) {
			this.triggering = true;
			if (typeof event == "string") {
		        event = { type: event };
		    }
		    if (!event.target) {
		        event.target = this;
		    }

		    if (!event.type) {
		        return;
		    }

		    if (this.subscribers[event.type] instanceof Array) {
		        var subscribers = this.subscribers[event.type];
		        for (var len = subscribers.length, i = len - 1; i >= 0; i -= 1) {
		        	if (subscribers[i] instanceof Array) {
						var sub = subscribers[i];
						for (var j = 0, gth = sub.length; j < gth; j += 1) {
							if (sub[j]) sub[j].call(this, event);
							//if (sub[j]) sub[j]();
						}
		        	}
		        }
		    }
			this.triggering = false;
		},
		/*	Keanu.start()
		 *	Starts the animation loop
		 */
		start: function() {
			if (!this.interval) {
				var self = this;
				this.interval = setInterval(function() {
					self.clear();
					self.trigger("enterFrame");
				}, INTERVAL_TIME);
				self.trigger("start");
			}
		},
		/*	Keanu.stop()
		 *	Stops the animation loop
		 */
		stop: function() { 
			clearInterval(this.interval);
			this.interval = null;
			this.clear();
			this.trigger("stop");
		},
		/*	Keanu.reset()
		 *	Reset the Keanu object
		 */
		reset: function() {
			var self = this,
				doIt = function() {
					self.subscribers = {};
					clearInterval(self.checkTimer);
					self.checkTimer = null;
					self.stop();
				};
			
			if (this.triggering) {
				setTimeout(this.reset, 5);
			} else {
				doIt();
			}
			
		},
		/*	Keanu.clear()
		 *	Clear only the region that is being used, or all of it if nothing is specified
		 */
		clear: function() { 
			var x = 0,
				y = 0,
				w = this.canvas.width,
				h = this.canvas.height;
			this.ctx.clearRect(x, y, w, h);
			this.checkedDimensions = false;
			this.clearX = 0;
			this.clearY = 0;
			this.clearW = 0;
			this.clearH = 0;
			//this.trigger("clear"); 
		},
		/*	Keanu.setDimension()
		 *	@dim - Number - dimension to set
		 *	@val - Number - value to check against the dimension
		 *	@fn - Function (Math.min or Math.max) - determine the appropriate value for dim
		 */
		setDimension: function(dim, val, fn) {
			dim = !isNaN(dim)
				? fn && fn(dim, val)
				: val;
			return dim;
		},
		/*	Keanu.setDimensions()
		 *	@dims - Object ({x: 0, y: 0, w: 0, h: 0}) - Dimensions to set
		 *	Determines the minimum X and Y, maximum Width and Height points to clear on redraw
		 */
		setDimensions: function(dims) {
			if (this.checkedDimensions) {
				this.clearX = this.setDimension(this.clearX, dims.x, Math.min);
				this.clearY = this.setDimension(this.clearY, dims.y, Math.min);
				this.clearW = this.setDimension(this.clearW, dims.w, Math.max);
				this.clearH = this.setDimension(this.clearH, dims.h, Math.max);
			} else {
				this.clearX = dims.x;
				this.clearY = dims.y;
				this.clearW = dims.w;
				this.clearH = dims.h;
				this.checkedDimensions = true;
			}
		},
		/*	Keanu.isEmpty()
		 *	o - Object
		 *	Checks a given object for properties
		 *	returns true or false
		 */
		isEmpty: function(o) {
			var empty = true,
				i, l, p;
			for (p in o) {
				if (o.hasOwnProperty(p)) {
					if (o[p] instanceof Array && o[p].length > 0) {
						for (i = 0, l = o[p].length; i < l; i += 1) {
							if (o[p][i] instanceof Array && o[p][i].length > 0) {
								empty = false;
								break;
							}
						}
					}
				}
			}
			return empty;
		},
		/*	Keanu.getIntervalTime()
		 *	returns the time interval of the animation loop
		 */
		getIntervalTime: function() { return INTERVAL_TIME; },
		/*
		 * Beware! Math be livin' below here, me hearties.
		 */
		tweens: {
			/*	Keanu.tweens[linear|easeIn|easeOut|easeInOut|quadraticBezierCurve]();
			 *	returns a value based upon the Time, Beginning value, Change between start and end, and animation Duration
			 */
			linear: function(t, b, c, d) { return c * t / d + b; },
			easeIn: function(t, b, c, d) { return c * (t /= d) * t + b;  },
			easeOut: function(t, b, c, d) { return -c * (t /= d) * (t - 2) + b;  },
			easeInOut: function(t, b, c, d) {
				if ((t /= d / 2) < 1) return c / 2 * t * t + b;
				return -c / 2 * ((--t) * (t - 2) - 1) + b;
			},
			quadraticBezierCurve: function(t, p0, p1, p2) {
				return ~~(Math.pow((1 - t), 2) * p0 + 2 * (1 - t) * t * p1 + Math.pow(t, 2) * p2);
			}
		}
	};
}());
