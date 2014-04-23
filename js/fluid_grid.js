/*
 * =====================================================================================
 *
 *		@title: fluid_grid.js
 *		@authors: JabbaTheGimp (anthdel.developer@gmail.com)
 *
 *    	@Description: 
 *
 *		@version: 
 *     	@date:	2014-04-22 22:23:21
 *
 * =====================================================================================
 */

'use strict';

var Experiment = (function() {
	var Experiment = function()
	{
		var self = this;

		// window event listeners
		window.oncontextmenu = function() { return false; }

	 	// canvas elements and event listeners
	 	this._canvas = document.getElementById('canvas');
	 	this._context = canvas.getContext('2d');
	 	this._context.fillStyle = 'black';
	 	this._context.strokeStyle = 'white';
	 	this._canvas.addEventListener('mouseover', handleMouseFocus.bind(this), false);
		this._canvas.addEventListener('mouseout', handleMouseFocus.bind(this), false);
		this._canvas.addEventListener('mousedown', onMouseDown.bind(this), false);
		this._canvas.addEventListener('mouseup', onMouseUp.bind(this), false);
		this._canvas.addEventListener('mousemove', onMouseMove.bind(this), false);

	 	// Utils
	 	this._stats = new Stats();
	 	this._gui = new dat.GUI();

	 	// general
	 	this._windowSize = { w: 1280, h: 720 };
	 	this._grid;
	 	this._mousePos = new Vector2();
	 	this._isLeftDown = false;
	 	this._isRightDown = false;

	 	// dat GUI modifaible variables
	 	this.mouseForce = 500;
	 	this.mouseRadius = 150;
	 	this.explosiveForce = 1200;
	 	this.explosiveRadius = 250;
	 	this.implosiveForce = 1200;
	 	this.implosiveRadius = 250;


	 	// begin experiment
	 	this.start();
	}

	Experiment.prototype.constructor = Experiment;

	var animationLoop = function() {
		var self = this;
		var running, lastFrame = +new Date,
			raf = window.mozRequestAnimationFrame    ||
	              window.webkitRequestAnimationFrame ||
	              window.msRequestAnimationFrame     ||
	              window.oRequestAnimationFrame;

	    function loop(now) {
	    	// stop the loop if render returned false
	    	if (running !== false) {
	    		raf(loop);
	    		var deltaT = now - lastFrame;

	    		if (deltaT < 160)
	    			running = draw.call(self, [(deltaT / 1000)]);
	    		lastFrame = now;
	    	}
	    }
		loop(lastFrame);
	}

	var onMouseMove = function(event)
	{
		var rect = this._canvas.getBoundingClientRect();
		this._mousePos.set(event.clientX - rect.left, event.clientY - rect.top);
		
		// apply a small explosive force to the grid at the current mouse position
		if (!this._isRightDown)
		{
			this._grid.applyForce(true, this.mouseForce, this._mousePos, this.mouseRadius);
		}
	}

	var onMouseDown = function(event)
	{
		event.preventDefault();

		this._isLeftDown = (event.button === 0);
		this._isRightDown = (event.button === 2);
	}

	var onMouseUp = function(event)
	{
		event.preventDefault();

		if (event.button === 0) this._isLeftDown = false;
		if (event.button === 2) this._isRightDown = false;
	}

	var handleMouseFocus = function(event)
	{
		if (event.type === 'mouseover')
		{
    		this._canvas.focus();
    		return false;
  		}

  		else if (event.type === 'mouseout')
  		{
    		canvas.blur();
    		return false;
  		}

  		return true;
	}

	var update = function(delta)
	{
		if (this._isLeftDown)
		{
			// apply a large explosive force to the grid at the current mouse position
			this._grid.applyForce(true, this.explosiveForce, this._mousePos, this.explosiveRadius);
		}
		else if (this._isRightDown)
		{
			// apply a large explosive force to the grid at the current mouse position
			this._grid.applyForce(false, this.implosiveForce, this._mousePos, this.implosiveRadius);
		}

		this._grid.update(delta);
	}

	var draw = function(delta)
	{
		this._stats.begin();

		update.call(this, [delta]);

		// clear our screen
		this._context.fillRect(0, 0, this._windowSize.w, this._windowSize.h);

		this._grid.draw(delta, this._context);

		this._stats.end();
	}

	Experiment.prototype.start = function()
	{
		// append our elements to body
		document.body.appendChild( this._stats.domElement );
		this._stats.domElement.style.position = 'absolute';
		this._stats.domElement.style.left = '20px';
		this._stats.domElement.style.top = '20px';

		// add variables to dat GUI
		this._gui.add(this, 'mouseForce', 100, 1000);
		this._gui.add(this, 'mouseRadius', 25, 300);
		this._gui.add(this, 'explosiveForce', 100, 2500);
		this._gui.add(this, 'explosiveRadius', 25, 1000);
		this._gui.add(this, 'implosiveForce', 100, 2500);
		this._gui.add(this, 'implosiveRadius', 25, 1000);


		// initialise the grid
		var maxGridPoints = 575;
		var spacing = new Vector2(Math.sqrt((this._windowSize.w * this._windowSize.h) / maxGridPoints),
			Math.sqrt((this._windowSize.w * this._windowSize.h) / maxGridPoints));
		this._grid = new Grid(this._gui, this._windowSize.w, this._windowSize.h, spacing);

		animationLoop.call(this);
	}

	return Experiment;
})();

window.addEventListener('load', function() {
	var experiment = new Experiment();
}, false);
