/* 
 * Keanu.js
 * (c) 2011 Nick Jurista
 * Keanu.js may be freely distributed under the MIT license.
 */ 

var Keanu; // Whoa
(function() {
	var INTERVAL_TIME = 10; // 10ms between each interval
	Keanu = function(id) {
		if (!id) return false;
		
		this.canvas = document.getElementById(id);
		this.ctx = this.canvas.getContext('2d');
		this.interval = null;
		this.checkTimer = null;
		this.triggering = false;
		this.subscribers = {};
	};

	Keanu.prototype = {
		constructor: Keanu,
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
						}
		        	}
		        }
		    }
			this.triggering = false;
		},
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
		stop: function() { 
			clearInterval(this.interval);
			this.interval = null;
			this.clear();
			this.trigger("stop");
		},
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
		clear: function() { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.trigger("clear"); },
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
		line: function(data) {
			if (!data) return;
			data.origin = data.origin || {};
			data.destination = data.destination || {};
			data.styles = data.styles || {};
			var originX = data.origin[0] || 0,
				originY = data.origin[1] || 0,
				destinationX = data.destination[0] || 0,
				destinationY = data.destination[1] || 0,
				w = data.styles.lineWidth || 0,
				s = data.styles.strokeStyle || "#FFF";
			this.ctx.beginPath();
			this.ctx.strokeStyle = s;
			this.ctx.lineWidth = w;
			this.ctx.moveTo(originX, originY);
			this.ctx.lineTo(destinationX, destinationY);
			this.ctx.stroke();
			this.ctx.closePath();
		},
		circle: function(data) {
			data = data || {};
			data.styles = data.styles || {};
			var x = data.x || 0,
				y = data.y || 0,
				r = data.r || 0,
				f = data.styles.fillStyle || "#FFF",
				w = data.styles.lineWidth || 0,
				s = data.styles.strokeStyle || "#FFF";
			this.ctx.fillStyle = f;
			this.ctx.strokeStyle = s;
			this.ctx.lineWidth = w;
			this.ctx.beginPath();
			this.ctx.arc(x, y, r, 0, Math.PI * 2, true);
			this.ctx.closePath();
			this.ctx.fill();
			this.ctx.stroke();
		},
		getIntervalTime: function() { return INTERVAL_TIME; },
		/*
		 * Beware! Math be livin' below here, me hearties.
		 */
		tweens: {
			// time, begin, change, duration
			linear: function(t, b, c, d) { return c * t / d + b; },
			easeIn: function(t, b, c, d) { return c * (t /= d) * t + b;  },
			easeOut: function(t, b, c, d) { return -c * (t /= d) * (t - 2) + b;  },
			easeInOut: function(t, b, c, d) {
				if ((t /= d / 2) < 1) return c / 2 * t * t + b;
				return -c / 2 * ((--t) * (t - 2) - 1) + b;
			},
			quadraticBezierCurve: function(t, p0, p1, p2) {
				return Math.pow((1 - t), 2) * p0 + 2 * (1 - t) * t * p1 + Math.pow(t, 2) * p2;
			}
		},
		Linear: function(keanu, opts, duration) {
			if (!keanu) return;
			var originX, originY, originRadius, destinationX, destinationY, destinationR, ease, fn, styles, ms, currentX, currentY, currentRadius, tick = 0, zIndex;
			opts.origin = opts.origin || [];
			opts.destination = opts.destination || [];
			
			originX	= opts.origin[0] || 0; // {origin: [x, y, r]}
			originY	= opts.origin[1] || 0;
			originRadius	= opts.origin[2] || 0;
			destinationX	= opts.destination[0] || 0; // {destination: [x, y, r]}
			destinationY	= opts.destination[1] || 0;
			destinationRadius	= opts.destination[2] || 0;
			draw = opts.draw || keanu.circle;
			ease = opts.easing || "linear"; // {easing: [linear | easeIn | easeOut | easeInOut | function() {}] }
			fn	= opts.callback;
			styles	= opts.styles || {};
			ms	= duration || 0;
			zIndex = opts.zIndex || 0;
			
			currentX	= originX;
			currentY	= originY;
			currentRadius = originRadius;

			var easing	= keanu.tweens[ease] ? keanu.tweens[ease] : (ease ? ease : keanu.tweens.linear), // this statement is too complex
				t = 0,
				currentTime = ms / INTERVAL_TIME,
				xChange = destinationX - originX,
				yChange = destinationY - originY,
				rChange = destinationRadius - originRadius,
				change = function() {
					currentX = easing(t, originX, xChange, currentTime);
					currentY = easing(t, originY, yChange, currentTime);
					currentRadius = easing(t, originRadius, rChange, currentTime);
				
					draw && draw.call(this, {
						x: currentX, 
						y: currentY, 
						r: currentRadius, 
						styles: { 
							fillStyle: styles.fillStyle || false,
							strokeStyle: styles.strokeStyle || false,
							lineWidth: styles.lineWidth || false
						}
					});
					t++;
					tick += INTERVAL_TIME;

					if (tick >= duration) {
						keanu.unsubscribe("enterFrame", change, zIndex);
						fn && fn();
					}
				};
			keanu.subscribe("enterFrame", change, zIndex);
		},
		Curve: function(keanu, opts, duration) {
			if (!keanu) return;
			var originX, originY, originRadius, destinationX, destinationY, destinationRadius, ease, fn, styles, ms, currentX, currentY, currentRadius, controlX, controlY, controlRadius, tick = 0, zIndex;
			opts.origin = opts.origin || [];
			opts.control = opts.control || [];
			opts.destination = opts.destination || [];
			
			originX	= opts.origin[0] || 0; // {origin: [x, y, r]}
			originY	= opts.origin[1] || 0;
			originRadius	= opts.origin[2] || 0;
			controlX	= opts.control[0] || 0; // {control: [x, y, r]}
			controlY	= opts.control[1] || 0;
			controlRadius = opts.control[2] || 0;
			destinationX	= opts.destination[0] || 0; // {destination: [x, y, r]}
			destinationY	= opts.destination[1] || 0;
			destinationRadius	= opts.destination[2] || 0;
			draw = opts.draw || keanu.circle;
			ease = opts.easing || "linear"; // {easing: [linear | easeIn | easeOut | easeInOut | function() {}] }
			fn	= opts.callback;
			styles = opts.styles || {};
			ms	= duration || 0;
			zIndex = opts.zIndex || 0;

			originX = originX !== controlX ? originX : originX + 1; // these have to be different for creating a proper curve
			originY = originY !== controlY ? originY : originY + 1;
			
			currentX	= originX;
			currentY	= originY;
			currentRadius = originRadius;

			var easing	= keanu.tweens[ease] ? keanu.tweens[ease] : (ease ? ease : keanu.tweens.linear), // this statement is too complex
				t = 0,
				xChange = destinationX - originX,
				yChange = destinationY - originY,
				rChange1 = controlRadius - originRadius,
				rChange2 = destinationRadius - controlRadius,
				currentTime = ms / INTERVAL_TIME,
				change = function() {
					currentX = easing(t, originX, xChange, currentTime);
					currentY = easing(t, originY, yChange, currentTime);

					if (t < currentTime / 6) {
						currentRadius = easing(t, originRadius, rChange1, currentTime);
					} else {
						currentRadius = easing(t, controlRadius, rChange2, currentTime);
					}
				
					if (controlX != 0) {
						currentX = keanu.tweens.quadraticBezierCurve((originX - currentX) / (originX - destinationX), originX, controlX, destinationX);
					}
					if (controlY != 0) {
						currentY = keanu.tweens.quadraticBezierCurve((originY - currentY) / (originY - destinationY), originY, controlY, destinationY);
					}
					draw && draw.call(this, {
						x: currentX, 
						y: currentY, 
						r: currentRadius, 
						styles: { 
							fillStyle: styles.fillStyle || false,
							strokeStyle: styles.strokeStyle || false,
							lineWidth: styles.lineWidth || false
						}
					});
					t++;
					tick += INTERVAL_TIME;
					if (tick >= duration) {
						keanu.unsubscribe("enterFrame", change, zIndex);
						fn && fn();
					}
				};

			keanu.subscribe("enterFrame", change, zIndex);
		}
	};
}());
