class Basketball 
    constructor: (keanu, opts, duration) ->
        return if not keanu

        @keanu = keanu
        @ctx = @keanu.ctx

        @origin = opts.origin or []
        @originX = @origin[0] or 0
        @originY = @origin[1] or 0
        @originRadius = @origin[2] or 0

        @control = opts.control or []
        @controlX = @control[0] or 0
        @controlY = @control[1] or 0
        @controlRadius = @control[2] or 0

        @destination = opts.destination or []
        @destinationX = @destination[0] or 0
        @destinationY = @destination[1] or 0
        @destinationRadius = @destination[2] or 0

        @trailStates = []
        @keepStates = 15
        @step = 3

        @animationMiddle = opts.animationMiddle or 2
        @shape = opts.shape or keanu.circle
        @styles = opts.styles or {}
        @zIndex = opts.zIndex or 0
        @easeType = opts.easeType or "linear"
        @callback = opts.callback
        @useTrail = opts.useTrail or true
        @duration = duration or 1000

        @easing = @keanu.tweens[@easeType]

        @originX = if @originX is @controlX then @originX + 1 else @originX
        @originY = if @originY is @controlY then @originY + 1 else @originY

        @ballX = @trailX = @shadowX = @originX
        @ballY = @trailY = @shadowY = @originY
        @ballRadius = @trailRadius = @shadowRadius = @originRadius

        @xChange = @destinationX - @originX
        @yChange = @destinationY - @originY
        @rChange1 = @controlRadius - @originRadius
        @rChange2 = @destinationRadius - @controlRadius

        @intervalTime = @keanu.getIntervalTime()
        @tickerStep = @duration / @intervalTime
        @frame = 0
        @tick = 0

        @draw = =>
            @drawShadow()
            @drawTrail()
            @drawShot()
            @frame++
            @tick += @intervalTime
            if @tick >= @duration
                console.log "callback"
                keanu.unsubscribe "enterFrame", @draw, @zIndex
                @trailStates = []
                @callback and @callback()
                true

        @keanu.subscribe "enterFrame", @draw
        this

    drawTrail: ->
        len = @trailStates.length
        if len > 0
            alpha = 0.1
            rad = 0.6

            i = len - 1
            while i >= 0
                @drawBall @keanu, 
                    x: @trailStates[i][0] or 0
                    y: @trailStates[i][1] or 0
                    r: (@trailStates[i][2] * rad) or  0
                    styles: 
                        fillStyle: "rgba(12, 131, 218, #{alpha})"
                        strokeStyle: "rgba(12, 131, 218, #{alpha})"

                @keanu.setDimensions
                    x: @trailStates[i][0] - (@trailStates[i][2] * rad)
                    y: @trailStates[i][1] - (@trailStates[i][2] * rad)
                    w: @trailStates[i][0] + (@trailStates[i][2] * rad)
                    h: @trailStates[i][1] + (@trailStates[i][2] * rad)

                alpha += 0.05
                rad += 0.02 if rad < 0.98
                i--
        this

    drawShadow: ->
        @shadowX = @easing @frame, @originX, @xChange, @tickerStep
        @shadowY = @easing @frame, @originY, @yChange, @tickerStep
        @shadowRadius = 2

        @drawBall @keanu, 
            x: @shadowX
            y: @shadowY
            r: @shadowRadius
            styles: 
                fillStyle: "#000"
                strokeStyle: "#000"
                lineWidth: "0"

        @keanu.setDimensions
            x: @shadowX - @shadowRadius
            y: @shadowY - @shadowRadius
            w: @shadowX + @shadowRadius
            h: @shadowY + @shadowRadius

        this

    handleTrailState: (state) ->
        temp = []
        loopLen = if @trailStates.length >= @keepStates then @keepStates else @trailStates.length

        temp.push state

        temp.push @trailStates[i] for i in [0...loopLen]

        @trailStates = temp

        this

    drawShot: ->
        @ballX = @easing @frame, @originX, @xChange, @tickerStep
        @ballY = @easing @frame, @originY, @yChange, @tickerStep

        if @frame < @tickerStep / @animationMiddle
            @ballRadius = @easing @frame, @originRadius, @rChange1, @tickerStep
        else
            @ballRadius = @easing @frame, @controlRadius, @rChange2, @tickerStep

        if @controlX isnt 0
            @ballX = @keanu.tweens.quadraticBezierCurve (@originX - @ballX) / (@originX - @destinationX), @originX, @controlX, @destinationX
        if @controlY isnt 0
            @ballY = @keanu.tweens.quadraticBezierCurve (@originY - @ballY) / (@originY - @destinationY), @originY, @controlY, @destinationY

        @handleTrailState [@ballX, @ballY, @ballRadius] if @frame % @step is 0

        @drawBall @keanu, 
            x: @ballX
            y: @ballY
            r: @ballRadius
            styles:
                fillStyle: @styles.fillStyle or false
                strokeStyle: @styles.strokeStyle or false
                lineWidth: @styles.lineWidth or false

        @keanu.setDimensions
            x: @ballX - @ballRadius
            y: @ballY - @ballRadius
            w: @ballX + @ballRadius
            h: @ballY + @ballRadius

        this

    drawBall: (keanu, data) ->
        data = data or {}
        data.styles = data.styles or {}
        x = data.x or 0
        y = data.y or 0
        r = data.r or 0
        isTrail = data.isTrail or false
        f = data.styles.fillStyle or "#E08428"
        w = data.styles.lineWidth or 0
        s = data.styles.strokeStyle or "#D07317"

        keanu.ctx.fillStyle = f
        keanu.ctx.strokeStyle = s
        keanu.ctx.lineWidth = w
        keanu.ctx.beginPath()
        keanu.ctx.arc x, y, r, 0, Math.PI * 2, true
        keanu.ctx.closePath()
        keanu.ctx.fill()
        keanu.ctx.stroke()

        this

    version: "0.2-coffee"

window.Keanu.modules.Basketball = Basketball
