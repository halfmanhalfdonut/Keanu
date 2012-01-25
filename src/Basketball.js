(function() {
  var Basketball;

  Basketball = (function() {

    function Basketball(keanu, opts, duration) {
      var _this = this;
      if (!keanu) return;
      this.keanu = keanu;
      this.ctx = this.keanu.ctx;
      this.origin = opts.origin || [];
      this.originX = this.origin[0] || 0;
      this.originY = this.origin[1] || 0;
      this.originRadius = this.origin[2] || 0;
      this.control = opts.control || [];
      this.controlX = this.control[0] || 0;
      this.controlY = this.control[1] || 0;
      this.controlRadius = this.control[2] || 0;
      this.destination = opts.destination || [];
      this.destinationX = this.destination[0] || 0;
      this.destinationY = this.destination[1] || 0;
      this.destinationRadius = this.destination[2] || 0;
      this.trailStates = [];
      this.keepStates = 15;
      this.step = 3;
      this.animationMiddle = opts.animationMiddle || 2;
      this.shape = opts.shape || keanu.circle;
      this.styles = opts.styles || {};
      this.zIndex = opts.zIndex || 0;
      this.easeType = opts.easeType || "linear";
      this.callback = opts.callback;
      this.useTrail = opts.useTrail || true;
      this.duration = duration || 1000;
      this.easing = this.keanu.tweens[this.easeType];
      this.originX = this.originX === this.controlX ? this.originX + 1 : this.originX;
      this.originY = this.originY === this.controlY ? this.originY + 1 : this.originY;
      this.ballX = this.trailX = this.shadowX = this.originX;
      this.ballY = this.trailY = this.shadowY = this.originY;
      this.ballRadius = this.trailRadius = this.shadowRadius = this.originRadius;
      this.xChange = this.destinationX - this.originX;
      this.yChange = this.destinationY - this.originY;
      this.rChange1 = this.controlRadius - this.originRadius;
      this.rChange2 = this.destinationRadius - this.controlRadius;
      this.intervalTime = this.keanu.getIntervalTime();
      this.tickerStep = this.duration / this.intervalTime;
      this.frame = 0;
      this.tick = 0;
      this.draw = function() {
        _this.drawShadow();
        _this.drawTrail();
        _this.drawShot();
        _this.frame++;
        _this.tick += _this.intervalTime;
        if (_this.tick >= _this.duration) {
          console.log("callback");
          keanu.unsubscribe("enterFrame", _this.draw, _this.zIndex);
          _this.trailStates = [];
          _this.callback && _this.callback();
          return true;
        }
      };
      this.keanu.subscribe("enterFrame", this.draw);
      this;
    }

    Basketball.prototype.drawTrail = function() {
      var alpha, i, len, rad;
      len = this.trailStates.length;
      if (len > 0) {
        alpha = 0.1;
        rad = 0.6;
        i = len - 1;
        while (i >= 0) {
          this.drawBall(this.keanu, {
            x: this.trailStates[i][0] || 0,
            y: this.trailStates[i][1] || 0,
            r: (this.trailStates[i][2] * rad) || 0,
            styles: {
              fillStyle: "rgba(12, 131, 218, " + alpha + ")",
              strokeStyle: "rgba(12, 131, 218, " + alpha + ")"
            }
          });
          this.keanu.setDimensions({
            x: this.trailStates[i][0] - (this.trailStates[i][2] * rad),
            y: this.trailStates[i][1] - (this.trailStates[i][2] * rad),
            w: this.trailStates[i][0] + (this.trailStates[i][2] * rad),
            h: this.trailStates[i][1] + (this.trailStates[i][2] * rad)
          });
          alpha += 0.05;
          if (rad < 0.98) rad += 0.02;
          i--;
        }
      }
      return this;
    };

    Basketball.prototype.drawShadow = function() {
      this.shadowX = this.easing(this.frame, this.originX, this.xChange, this.tickerStep);
      this.shadowY = this.easing(this.frame, this.originY, this.yChange, this.tickerStep);
      this.shadowRadius = 2;
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
      this.keanu.setDimensions({
        x: this.shadowX - this.shadowRadius,
        y: this.shadowY - this.shadowRadius,
        w: this.shadowX + this.shadowRadius,
        h: this.shadowY + this.shadowRadius
      });
      return this;
    };

    Basketball.prototype.handleTrailState = function(state) {
      var i, loopLen, temp;
      temp = [];
      loopLen = this.trailStates.length >= this.keepStates ? this.keepStates : this.trailStates.length;
      temp.push(state);
      for (i = 0; 0 <= loopLen ? i < loopLen : i > loopLen; 0 <= loopLen ? i++ : i--) {
        temp.push(this.trailStates[i]);
      }
      this.trailStates = temp;
      return this;
    };

    Basketball.prototype.drawShot = function() {
      this.ballX = this.easing(this.frame, this.originX, this.xChange, this.tickerStep);
      this.ballY = this.easing(this.frame, this.originY, this.yChange, this.tickerStep);
      if (this.frame < this.tickerStep / this.animationMiddle) {
        this.ballRadius = this.easing(this.frame, this.originRadius, this.rChange1, this.tickerStep);
      } else {
        this.ballRadius = this.easing(this.frame, this.controlRadius, this.rChange2, this.tickerStep);
      }
      if (this.controlX !== 0) {
        this.ballX = this.keanu.tweens.quadraticBezierCurve((this.originX - this.ballX) / (this.originX - this.destinationX), this.originX, this.controlX, this.destinationX);
      }
      if (this.controlY !== 0) {
        this.ballY = this.keanu.tweens.quadraticBezierCurve((this.originY - this.ballY) / (this.originY - this.destinationY), this.originY, this.controlY, this.destinationY);
      }
      if (this.frame % this.step === 0) {
        this.handleTrailState([this.ballX, this.ballY, this.ballRadius]);
      }
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
      this.keanu.setDimensions({
        x: this.ballX - this.ballRadius,
        y: this.ballY - this.ballRadius,
        w: this.ballX + this.ballRadius,
        h: this.ballY + this.ballRadius
      });
      return this;
    };

    Basketball.prototype.drawBall = function(keanu, data) {
      var f, isTrail, r, s, w, x, y;
      data = data || {};
      data.styles = data.styles || {};
      x = data.x || 0;
      y = data.y || 0;
      r = data.r || 0;
      isTrail = data.isTrail || false;
      f = data.styles.fillStyle || "#E08428";
      w = data.styles.lineWidth || 0;
      s = data.styles.strokeStyle || "#D07317";
      keanu.ctx.fillStyle = f;
      keanu.ctx.strokeStyle = s;
      keanu.ctx.lineWidth = w;
      keanu.ctx.beginPath();
      keanu.ctx.arc(x, y, r, 0, Math.PI * 2, true);
      keanu.ctx.closePath();
      keanu.ctx.fill();
      keanu.ctx.stroke();
      return this;
    };

    Basketball.prototype.version = "0.2-coffee";

    return Basketball;

  })();

  window.Keanu.modules.Basketball = Basketball;

}).call(this);
