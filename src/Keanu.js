(function() {
  var INTERVAL_TIME;

  INTERVAL_TIME = 10;

  window.Keanu = (function() {

    function Keanu(id) {
      if (!id) return;
      this.canvas = document.getElementById(id);
      this.ctx = this.canvas.getContext('2d');
      this.isAnimating = false;
      this.interval = null;
      this.lastLoop = 0;
      this.checkTimer = null;
      this.triggering = false;
      this.subscribers = {};
      this.checkedDimensions = false;
      this.clearX = 0;
      this.clearY = 0;
      this.clearW = this.canvas.width;
      this.clearH = this.canvas.height;
      window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
      this;
    }

    Keanu.prototype.subscribe = function(type, listener, zIndex) {
      if (zIndex == null) zIndex = 0;
      if (!this.subscribers[type]) this.subscribers[type] = [];
      if (!this.subscribers[type][zIndex]) this.subscribers[type][zIndex] = [];
      this.subscribers[type][zIndex].push(listener);
      if (!this.interval && !this.isAnimating && type === "enterFrame") {
        this.start();
      }
    };

    Keanu.prototype.unsubscribe = function(type, listener, zIndex) {
      var cutIt, i, j, s, sub, _len, _len2, _len3, _ref, _ref2,
        _this = this;
      cutIt = function() {
        if ((_this.subscribers.enterFrame && _this.subscribers.enterFrame.length === 0) || (_this.subscribers.enterFrame && _this.subscribers.enterFrame.length === 1 && _this.subscribers.enterFrame[0].length === 0)) {
          _this.stop();
        }
      };
      if (zIndex) {
        if (this.subscribers[type] instanceof Array) {
          if (this.subscribers[type][zIndex] instanceof Array) {
            _ref = this.subscribers[type][zIndex];
            for (i = 0, _len = _ref.length; i < _len; i++) {
              sub = _ref[i];
              if (sub === listener) {
                this.subscribers[type][zIndex].splice(i, 1);
                break;
              }
            }
          }
        }
      } else {
        if (this.subscribers[type] instanceof Array) {
          _ref2 = this.subscribers[type];
          for (i = 0, _len2 = _ref2.length; i < _len2; i++) {
            sub = _ref2[i];
            if (sub instanceof Array) {
              for (j = 0, _len3 = sub.length; j < _len3; j++) {
                s = sub[j];
                if (s === listener) {
                  sub.splice(j, 1);
                  break;
                }
              }
            } else {
              if (subscribers === listener) {
                this.subscribers[type].splice(i, 1);
                break;
              }
            }
          }
        }
      }
      clearTimeout(this.checkTimer);
      this.checkTimer = setTimeout(cutIt, 100);
    };

    Keanu.prototype.trigger = function(event) {
      var s, sub, _i, _j, _len, _len2, _ref;
      this.triggering = true;
      if (typeof event === "string") {
        event = {
          type: event
        };
      }
      if (!event.target) event.target = this;
      if (!event.type) return;
      if (this.subscribers[event.type] instanceof Array) {
        _ref = this.subscribers[event.type];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          sub = _ref[_i];
          if (sub instanceof Array) {
            for (_j = 0, _len2 = sub.length; _j < _len2; _j++) {
              s = sub[_j];
              if (s) s.call(this, event);
            }
          }
        }
      }
      this.triggering = false;
    };

    Keanu.prototype.start = function() {
      var looper,
        _this = this;
      looper = function() {
        if (_this.isAnimating || _this.interval) {
          if (_this.lastLoop === 0) _this.lastLoop = +(new Date);
          _this.clear();
          if ((+(new Date)) - _this.lastLoop > 30000) {
            _this.reset();
          } else {
            _this.lastLoop = +(new Date);
            _this.trigger("enterFrame");
          }
          if (window.requestAnimationFrame) {
            window.requestAnimationFrame(looper, _this.canvas);
          }
        }
      };
      if (window.requestAnimationFrame && !this.isAnimating) {
        this.isAnimating = true;
        window.requestAnimationFrame(looper, this.canvas);
        this.trigger("start");
      } else if (!window.requestAnimationFrame && !this.interval) {
        this.interval = setInterval(looper, INTERVAL_TIME);
        this.trigger("start");
      }
    };

    Keanu.prototype.stop = function() {
      this.isAnimating = false;
      clearInterval(this.interval);
      this.interval = null;
      this.clear();
      this.trigger("stop");
    };

    Keanu.prototype.reset = function() {
      var doIt,
        _this = this;
      doIt = function() {
        _this.subscribers = [];
        clearInterval(_this.checkTimer);
        _this.checkTimer = null;
        _this.stop();
        _this.lastLoop = 0;
        return _this.trigger("reset");
      };
      if (this.triggering) {
        setTimeout(this.reset, 5);
      } else {
        doIt();
      }
    };

    Keanu.prototype.clear = function() {
      var h, w, x, y;
      x = 0;
      y = 0;
      w = this.canvas.width;
      h = this.canvas.height;
      this.ctx.clearRect(x, y, w, h);
      this.checkedDimensions = false;
      this.clearX = 0;
      this.clearY = 0;
      this.clearW = 0;
      this.clearH = 0;
    };

    Keanu.prototype.setDimension = function(dim, val, fn) {
      if (!isNaN(dim)) {
        return fn && fn(dim, val);
      } else {
        return val;
      }
    };

    Keanu.prototype.setDimensions = function(dims) {
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
    };

    Keanu.prototype.isEmpty = function(o) {
      var i, p, _i, _j, _len, _len2, _ref;
      for (_i = 0, _len = o.length; _i < _len; _i++) {
        p = o[_i];
        if (o[p] instanceof Array && o[p].length > 0) {
          _ref = o[p];
          for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
            i = _ref[_j];
            if (o[p][i] instanceof Array && o[p][i].length > 0) return false;
          }
        }
      }
      return true;
    };

    Keanu.prototype.getIntervalTime = function() {
      return INTERVAL_TIME;
    };

    Keanu.prototype.tweens = {
      linear: function(t, b, c, d) {
        return c * t / d + b;
      },
      easeIn: function(t, b, c, d) {
        return c * (t /= d) * t + b;
      },
      easeOut: function(t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
      },
      easeInOut: function(t, b, c, d) {
        if (t /= d / 2 < 1) {
          return c / 2 * t * t * b;
        } else {
          return -c / 2 * ((--t) * (t - 2) - 1) + b;
        }
      },
      quadraticBezierCurve: function(t, p0, p1, p2) {
        return ~~(Math.pow(1 - t, 2) * p0 + 2 * (1 - t) * t * p1 + Math.pow(t, 2) * p2);
      }
    };

    return Keanu;

  })();

  window.Keanu.modules = {};

}).call(this);
