/*
 * =====================================================================================
 *
 *		@title: PointMass.js
 *		@authors: JabbaTheGimp (anthdel.developer@gmail.com)
 *
 *    	@Description: 
 *
 *		@version: 
 *     	@date:	2014-04-23 14:52:49
 *
 * =====================================================================================
 */
'use strict';

var PointMass = function(position, inverseMass)
{
 	this.position = position;
 	this.inverseMass = inverseMass;
 	this.velocity = new Vector2();
 	
 	this._acceleration = new Vector2();
 	this._damping = 0.98;
}

PointMass.prototype.constructor = PointMass;

PointMass.prototype.applyForce = function(force)
{
	this._acceleration.addSelf(force.multiplyScalar(this.inverseMass));
}

PointMass.prototype.increaseDamping = function(factor)
{
	this._damping *= factor; 
}

PointMass.prototype.update = function(delta)
{
	this.velocity.addSelf(this._acceleration.clone().multiplyScalar(delta));
	this.position.addSelf(this.velocity.clone().multiplyScalar(delta));
	this._acceleration.set(0, 0);

	if (this.velocity.lengthSq() < 0.001 * 0.001)
	{
		this.velocity.set(0, 0);
	}

	this.velocity.multiplyScalar(this._damping);
	this._damping = 0.98;
}


/*
 * =====================================================================================
 *
 *		@title: Spring.js
 *		@authors: JabbaTheGimp (anthdel.developer@gmail.com)
 *
 *    	@Description: 
 *
 *		@version: 
 *     	@date:	2014-04-23 14:52:49
 *
 * =====================================================================================
 */
var Spring = function(end1, end2, stiffness, damping)
{
	this._end1 = end1;
	this._end2 = end2;
	this._stiffness = stiffness;
	this._damping = damping;
	this._targetLength = end1.position.distanceTo(end2.position) * 0.95;

	this._distance = new Vector2();
	this._dv = new Vector2();
	this._force = new Vector2();
}

Spring.prototype.constructor = Spring;

Spring.prototype.update = function(delta)
{
	// distance between our two point masses
	this._distance.set(this._end1.position.x - this._end2.position.x, 
		this._end1.position.y - this._end2.position.y);
	var length = this._distance.length();

	if (length > this._targetLength)
	{
		this._distance.normalize().multiplyScalar(length - this._targetLength);

		this._dv.set(this._end2.velocity.x - this._end1.velocity.x, 
			this._end2.velocity.y - this._end1.velocity.y);
		this._force.set(this._distance.x * this._stiffness, this._distance.y * this._stiffness);
		this._force.x -= this._dv.x * this._damping * delta;
		this._force.y -= this._dv.y * this._damping * delta;

		this._end1.applyForce(this._force.clone().negate());
		this._end2.applyForce(this._force);
	}
}



/*
 * =====================================================================================
 *
 *		@title: Grid.js
 *		@authors: JabbaTheGimp (anthdel.developer@gmail.com)
 *
 *    	@Description: 
 *
 *		@version: 
 *     	@date:	2014-04-23 14:52:49
 *
 * =====================================================================================
 */
var Grid = function(gui, width, height, spacing)
{
	this._springs = [];
	this._points;
	this._spacing = spacing;
	this._delta = new Vector2();
	this._fixedPoints;

	// grid visual properties
	this.strokeColor = '#FFFFFF';

	// set the size of our grid to dimensions passed in with spacing in between
	this._numColumns = Math.round(width / this._spacing.x);
	this._numRows = Math.round(height / this._spacing.y);

	// initialise dat GUI widgets
	gui.addColor(this, 'strokeColor');
	
	initPointMasses.call(this);
	initSprings.call(this);
}

Grid.prototype.constructor = Grid;

var initPointMasses = function()
{
	// initialise our moving and fixed point masses
	var xCoord = 0, yCoord = 0;
	this._points = new Array(this._numRows);
	this._fixedPoints = new Array(this._numRows);
	for (var row = 0; row < this._numRows; row++)
	{
		this._points[row] = new Array(this._numColumns);
		this._fixedPoints[row] = new Array(this._numColumns);
		for (var column = 0; column < this._numColumns; column++)
		{
			this._points[row][column] = new PointMass(new Vector2(xCoord, yCoord), 1);
			this._fixedPoints[row][column] = new PointMass(new Vector2(xCoord, yCoord), 0);
			xCoord += this._spacing.x;
		}
		yCoord += this._spacing.y;
		xCoord = 0;
	}
}

var initSprings = function()
{
	// initialise all springs
	var stiffness = 100;
	var damping = 45;
	for (var y = 0; y < this._numRows; y++)
	{
		for (var x = 0; x < this._numColumns; x++)
		{
			if (x === 0 || y === 0 || x === this._numColumns - 1 || y === this._numRows - 1)
			{
				this._springs.push(new Spring(this._fixedPoints[y][x],
					this._points[y][x], 10, 10));
			}
			else if (x % 3 === 0 && y % 3 === 0)
			{
				this._springs.push(new Spring(this._fixedPoints[y][x],
					this._points[y][x], 0.2, 0.2));
			}

			if (x > 0)
			{
				this._springs.push(new Spring(this._points[y][x - 1],
					this._points[y][x], stiffness, damping));
			}

			if (y > 0)
			{
				this._springs.push(new Spring(this._points[y - 1][x],
					this._points[y][x], stiffness, damping));
			}
		}
	}
}

Grid.prototype.update = function(delta)
{
	for (var i = 0, len = this._springs.length; i < len; i++)
	{
		this._springs[i].update(delta);
	}

	for (var y = 0; y < this._numRows; y++)
	{
		for (var x = 0; x < this._numColumns; x++)
		{
			this._points[y][x].update(delta);
		}
	}
}

Grid.prototype.draw = function(delta, context)
{
	var point, left, up;

	context.strokeStyle = this.strokeColor;
	for (var y = 1; y < this._numRows; y++)
	{
		for (var x = 1; x < this._numColumns; x++)
		{
			point = this._points[y][x].position;

			if (x > 1)
			{
				left = this._points[y][x-1].position;
				context.beginPath();
				context.moveTo(left.x, left.y);
				context.lineTo(point.x, point.y);
				context.stroke();
			}
			if (y > 1)
			{
				up = this._points[y-1][x].position;
				context.beginPath();
				context.moveTo(up.x, up.y);
				context.lineTo(point.x, point.y);
				context.stroke();
			}			
		}
	}
}

Grid.prototype.applyForce = function(explosive, force, position, radius)
{
	var distanceSq, totalForce, forceFactor;
	for (var y = 0; y < this._numRows; y++)
	{
		for (var x = 0; x < this._numColumns; x++)
		{
			var point = this._points[y][x];

			distanceSq = position.distanceToSquared(point.position);
			if (distanceSq < radius*radius)
			{
				totalForce = new Vector2(point.position.x - position.x, 
					point.position.y - position.y);
				forceFactor = (explosive) ? 1000 : -1000;
				totalForce.multiplyScalar(force * forceFactor / (10000 + distanceSq));
				point.applyForce(totalForce);
				point.increaseDamping(0.6);
			}
		}
	}
}



