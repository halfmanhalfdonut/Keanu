// So our basketball needs to take some options -- namely if it's using ball trails or not. Yes? Yes.
// We also need it to keep track of its own bounding box. That is, the minimum and maximum X/Y values
// We can probably reduce mouse trail load by making them one shape rather than multiple circles.
(function() {
	// The only thing I smoke are fools like you on the b-ball court
	var Basketball = function(keanu, opts, duration) { 
		if (!keanu) return; // Well forget YOU, then. No where to draw this bad boy!
		var self = this; // let's keep a reference to ourself, shall we?

		// Add in all of our options here
		this.keanu = keanu;
		this.ctx = this.keanu.ctx;

		// origin -- [x, y, radius]
		this.origin = opts.origin || [];
		this.originX = this.origin[0] || 0;
		this.originY = this.origin[1] || 0;
		this.originRadius = this.origin[2] || 0;

		// control points, middle of the curve from origin to destination
		this.control = opts.control || [];
		this.controlX = this.control[0] || 0;
		this.controlY = this.control[1] || 0;
		this.controlRadius = this.control[2] || 0;

		// destination -- [x, y, radius]
		this.destination = opts.destination || [];
		this.destinationX = this.destination[0] || 0;
		this.destinationY = this.destination[1] || 0;
		this.destinationRadius = this.destination[2] || 0;

		// Our ball trail will just be a collection of previous states
		// We'll slap lower alpha value on them as they get further away
		this.trailStates = [];
		
		this.animationMiddle = opts.animationMiddle || 2; // What are we dividing the length by for a "midpoint?"
		this.shape = opts.shape || keanu.circle; // default to a circle -- it IS a ball after all
		this.styles = opts.styles || {}; // Hash of properties, completely unnecessary though
		this.zIndex = opts.zIndex || 0; // default to the lowest z-index
		this.easeType = opts.easeType || "linear"; // default to none (linear)
		this.callback = opts.callback; // When the animation completes, fire it up! Or nothing, whichever
		this.useTrail = opts.useTrail || true; // This option is for low-end browsers
		this.duration = duration || 1000; // time in milliseconds

		// Need to set up some values for this animation, eh?
		this.easing = this.keanu.tweens[this.easeType];

		// The origin and control X/Y values cannot be identical or the curve will wonk out
		this.originX = this.originX !== this.controlX ? this.originX : this.originX + 1;
		this.originY = this.originY !== this.controlY ? this.originY : this.originY + 1;

		// We need to initialize the ball, trail and shadow info.
		this.ballX = this.trailX = this.shadowX = this.originX;
		this.ballY = this.trailY = this.shadowY = this.originY;
		this.ballRadius = this.trailRadius = this.shadowRadius = this.originRadius;

		// Set up our animation change values - the distance between various points
		this.xChange = this.destinationX - this.originX;
		this.yChange = this.destinationY - this.originY;
		this.rChange1 = this.controlRadius - this.originRadius;
		this.rChange2 = this.destinationRadius - this.controlRadius;

		// Set up the timing bits
		this.intervalTime = this.keanu.getIntervalTime();
		this.tickerStep = this.duration / this.intervalTime;
		this.frame = 0;
		this.tick = 0;

		// this is the Keanu enterFrame callback -- it provides the draw state for our basketball at each frame
		this.draw = function() {
			self.drawShadow();
			if (this.useTrail) self.drawTrail();
			self.drawShot();
			self.frame++;
			self.tick += self.intervalTime;
			if (self.tick >= self.duration) {
				keanu.unsubscribe("enterFrame", self.draw, self.zIndex);
				this.trailStates = [];
				self.callback && self.callback();
			}
		};

		// Without this step, Keanu has no idea of our existence..
		this.keanu.subscribe("enterFrame", this.draw);
	};

	// This kind of brings the ball to life, no?
	Basketball.prototype.drawTrail = function() {
		var len = this.trailStates.length,
			i;
		// If we have any previous states, draw them
		if (len > 0) {
			var alpha = 0.4;
			
			// Draw these in reverse order
			for (i = len - 1; i >= 0; i--) {
				// Draw this state on the canvas
				this.drawBall(this.keanu, {
					x: this.trailStates[i][0] || 0, // x
					y: this.trailStates[i][1] || 0, // y
					r: this.trailStates[i][2] || 0, // radius
					styles: {
						fillStyle: "rgba(247, 180, 12, "+ alpha +")",
						strokeStyle: "rgba(247, 180, 12, "+ alpha +")"
					}
				});
				// Give Keanu our bounding box for a given ball
				this.keanu.setDimensions({
					x: this.trailStates[i][0] - this.trailStates[i][2],
					y: this.trailStates[i][1] - this.trailStates[i][2],
					w: this.trailStates[i][0] + this.trailStates[i][2],
					h: this.trailStates[i][1] + this.trailStates[i][2]
				});
				// as we get closer to the ball, make it more opaque
				alpha += 0.04;
			}
		}
	};

	// Without this, the ball is nothing. NOTHING. I mean, this just gives it an added dimension. Ask wolfmother.
	Basketball.prototype.drawShadow = function() {
		this.shadowX = this.easing(this.frame, this.originX, this.xChange, this.tickerStep);
		this.shadowY = this.easing(this.frame, this.originY, this.yChange, this.tickerStep);
		this.shadowRadius = 2;

		// Draw this state!
		this.drawBall(this.keanu, {
			x: this.shadowX, 
			y: this.shadowY, 
			r: this.shadowRadius, 
			styles: { 
				fillStyle: "#000",
				strokeStyle: "#000",
				lineWidth: "0"
			}
		});
		// Let keanu know about the shadow's bounding box
		this.keanu.setDimensions({
			x: this.shadowX - this.shadowRadius,
			y: this.shadowY - this.shadowRadius,
			w: this.shadowX + this.shadowRadius,
			h: this.shadowY + this.shadowRadius
		});
	};
	
	// Handles the trail states for each frame of the animation, keeping the last 10
	Basketball.prototype.handleTrailState = function(state) {
		var temp = [],
			loopLen = this.trailStates.length >= 10 ? 10 : this.trailStates.length; // use only as many iterations as possible
			
		temp.push(state); // add the first state to the top
		
		// add the remaining 9 (or less) states
		for (var i = 0; i < loopLen; i++) {
			temp.push(this.trailStates[i]);
		}

		// Set the trail states to the temp
		this.trailStates = temp;
	};

	// I suppose if you're not drawing the ball itself, the animations lose their purpose. It's an existential crisis waiting to happen.
	Basketball.prototype.drawShot = function() {
		this.ballX = this.easing(this.frame, this.originX, this.xChange, this.tickerStep);
		this.ballY = this.easing(this.frame, this.originY, this.yChange, this.tickerStep);

		// If we're just starting out, we need to animate the radius larger
		if (this.frame < this.tickerStep / this.animationMiddle) {
			this.ballRadius = this.easing(this.frame, this.originRadius, this.rChange1, this.tickerStep);
		// otherwise it needs to animate the radius smaller
		} else {
			this.ballRadius = this.easing(this.frame, this.controlRadius, this.rChange2, this.tickerStep);
		}

		// As long as this has control points, animate towards them	
		if (this.controlX != 0) {
			this.ballX = this.keanu.tweens.quadraticBezierCurve((this.originX - this.ballX) / (this.originX - this.destinationX), this.originX, this.controlX, this.destinationX);
		}
		if (this.controlY != 0) {
			this.ballY = this.keanu.tweens.quadraticBezierCurve((this.originY - this.ballY) / (this.originY - this.destinationY), this.originY, this.controlY, this.destinationY);
		}

		// Every third frame, keep the ball's state. This is preference. Keeping every state makes it look more like a line.
		// Think of this like a "step" in a drawing program
		if (this.frame % 3 == 0) this.handleTrailState([this.ballX, this.ballY, this.ballRadius]);

		// Draw it on the canvas
		this.drawBall(this.keanu, {
			x: this.ballX,
			y: this.ballY,
			r: this.ballRadius,
			styles: { 
				fillStyle: this.styles.fillStyle || false,
				strokeStyle: this.styles.strokeStyle || false,
				lineWidth: this.styles.lineWidth || false
			}
		});
		// Let keanu know about our bounding box
		this.keanu.setDimensions({
			x: this.ballX - this.ballRadius,
			y: this.ballY - this.ballRadius,
			w: this.ballX + this.ballRadius,
			h: this.ballY + this.ballRadius
		});
	};
	
	// A basketball! Ok so it's just an orange circle (by default..)
	Basketball.prototype.drawBall = function(keanu, data) {
		data = data || {};
		data.styles = data.styles || {};
		var x = data.x || 0,
			y = data.y || 0,
			r = data.r || 0,
			isTrail = data.isTrail || false,
			f = data.styles.fillStyle || "#E08428",
			w = data.styles.lineWidth || 0,
			s = data.styles.strokeStyle || "#D07317";
		keanu.ctx.fillStyle = f;
		keanu.ctx.strokeStyle = s;
		keanu.ctx.lineWidth = w;
		keanu.ctx.beginPath();
		keanu.ctx.arc(x, y, r, 0, Math.PI * 2, true);
		keanu.ctx.closePath();
		
		keanu.ctx.fill();
		keanu.ctx.stroke();
	};

	// This means nothing, but I felt like giving it a version number.
	Basketball.prototype.version = "0.0.0.0.0.0.1-theta-confirmed";

	// Add the Basketball module to Keanu. Yeehaw.
	Keanu.modules.Basketball = Basketball;
}());
