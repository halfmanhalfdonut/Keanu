INTERVAL_TIME = 10 # 10ms between each interval
# whoa
# Keanu constructor (new Keanu())
# @id - String - DOM element ID for desired canvas object
# returns Keanu object
class window.Keanu
    constructor: (id) ->
        return if not id
        @canvas = document.getElementById id
        @ctx = @canvas.getContext '2d'
        @isAnimating = false # for requestAnimationFrame
        @interval = null # backup for non-RAF browsers
        @lastLoop = 0
        @checkTimer = null
        @triggering = false
        @subscribers = {}
        @checkedDimensions = false
        @clearX = 0
        @clearY = 0
        @clearW = @canvas.width
        @clearH = @canvas.height
        window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame
        this

    # Keanu.subscribe()
    # @type - String - event type
    # @listener - Function - callback fired when this event is triggered
    # @zIndex - Number - z-index of anything animated within the provided callback
    subscribe: (type, listener, zIndex = 0) ->
        @subscribers[type] = [] if not @subscribers[type]
        @subscribers[type][zIndex] = [] if not @subscribers[type][zIndex]
        @subscribers[type][zIndex].push listener
        @start() if not @interval and not @isAnimating and type is "enterFrame"
        return

    # Keanu.unsubscribe()
    # @type - String - event type
    # @listener - Function - callback
    # @zIndex - Number - z-index on the animation stack
    unsubscribe: (type, listener, zIndex) ->
        cutIt = => 
            @stop() if (@subscribers.enterFrame and @subscribers.enterFrame.length is 0) or (@subscribers.enterFrame and @subscribers.enterFrame.length is 1 and @subscribers.enterFrame[0].length is 0)
            return

        if zIndex # if they send a zIndex, use it
            if @subscribers[type] instanceof Array
                if @subscribers[type][zIndex] instanceof Array
                    for sub, i in @subscribers[type][zIndex]
                        if sub is listener
                            @subscribers[type][zIndex].splice i, 1
                            break
        else # otherwise check all subscribers
            if @subscribers[type] instanceof Array
                for sub, i in @subscribers[type]
                    if sub instanceof Array
                        for s, j in sub
                            if s is listener
                                sub.splice j, 1
                                break
                    else
                        if subscribers is listener
                            @subscribers[type].splice i, 1
                            break
        clearTimeout @checkTimer
	
        @checkTimer = setTimeout cutIt, 100
        return

    # Keanu.trigger()
    # @event - String - event type
    # Fires a given event if a given event exists
    trigger: (event) ->
        @triggering = true
        event = type: event if typeof event is "string"
        event.target = this if not event.target
        return if not event.type

        if @subscribers[event.type] instanceof Array
            for sub in @subscribers[event.type]
                if sub instanceof Array
                    s.call this, event for s in sub when s
        @triggering = false
        return

    # Keanu.start()
    # Starts the animation loop
    start: ->
        looper = =>
            if @isAnimating or @interval # this could be using RAF or a timer
                @lastLoop = +new Date if @lastLoop is 0
                @clear()
                # Get rid of the elements if they've been sitting in wait for too long
                if (+new Date) - @lastLoop > 30000
                    @reset()
                else
                    @lastLoop = +new Date
                    @trigger "enterFrame"
                window.requestAnimationFrame looper, @canvas if window.requestAnimationFrame
            return
        if window.requestAnimationFrame and not @isAnimating
            @isAnimating = true
            window.requestAnimationFrame looper, @canvas
            @trigger "start"
        else if not window.requestAnimationFrame and not @interval
            @interval = setInterval looper, INTERVAL_TIME
            @trigger "start"
        return

    # Keanu.stop()
    # Stops the animation loop
    stop: ->
        @isAnimating = false
        clearInterval(@interval)
        @interval = null
        @clear()
        @trigger "stop"
        return

    # Keanu.reset()
    # Reset the Keanu object
    reset: ->
        doIt = =>
            @subscribers = []
            clearInterval @checkTimer
            @checkTimer = null
            @stop()
            @lastLoop = 0
            @trigger "reset"
        if @triggering
            setTimeout @reset, 5
        else
            doIt()
        return

    # Keanu.clear()
    # Clear only the region that is being used, or all of it if nothing is specified
    clear: ->
        x = 0
        y = 0
        w = @canvas.width
        h = @canvas.height
        @ctx.clearRect x, y, w, h
        @checkedDimensions = false
        @clearX = 0
        @clearY = 0
        @clearW = 0
        @clearH = 0
        return

    # Keanu.setDimension()
    # @dim - Number - dimension to set
    # @val - Number - value to check against the dimension
    # @fn - Function (Math.min or Math.max) - determine the appropriate value for dim
    setDimension: (dim, val, fn) ->
        if not isNaN(dim) then fn and fn(dim, val) else val

    # Keanu.setDimensions()
    # @dims - Object ({x: 0, y: 0, w: 0, h: 0}) - Dimensions to set
    # Determines the minimum X and Y, maximum Width and Height points to clear on redraw
    setDimensions: (dims) ->
        if @checkedDimensions
            @clearX = @setDimension @clearX, dims.x, Math.min
            @clearY = @setDimension @clearY, dims.y, Math.min
            @clearW = @setDimension @clearW, dims.w, Math.max
            @clearH = @setDimension @clearH, dims.h, Math.max
        else
            @clearX = dims.x
            @clearY = dims.y
            @clearW = dims.w
            @clearH = dims.h
            @checkedDimensions = true
        return

    # Keanu.isEmpty()
    # o - Object
    # Checks a given object for properties
    # returns true or false
    isEmpty: (o) ->
        for own p in o
            if o[p] instanceof Array and o[p].length > 0
                for i in o[p]
                    if o[p][i] instanceof Array and o[p][i].length > 0
                        return false
        true

    # Keanu.getIntervalTime()
    # returns the time interval of the animation loop
    getIntervalTime: ->
        INTERVAL_TIME

    # Beware! Math be livin' below here, me hearties.
    # Keanu.tweens[linear|easeIn|easeOut|easeInOut|quadraticBezierCurve]();
    # returns a value based upon the Time, Beginning value, Change between start and end, and animation Duration
    tweens:
        linear: (t, b, c, d) -> c * t / d + b
        easeIn: (t, b, c, d) -> c * (t /= d) * t + b
        easeOut: (t, b, c, d) -> -c * (t /= d) * (t - 2) + b
        easeInOut: (t, b, c, d) ->
            if t /= d / 2 < 1
                c / 2 * t * t * b
            else
                -c / 2 * ((--t) * (t - 2) - 1) + b
        quadraticBezierCurve: (t, p0, p1, p2) ->
            ~~(Math.pow((1 - t), 2) * p0 + 2 * (1 - t) * t * p1 + Math.pow(t, 2) * p2)
# Optional modules namespace for external modules
window.Keanu.modules = {}
