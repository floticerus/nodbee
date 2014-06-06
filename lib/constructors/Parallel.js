/** nodebee parallel class
 *  2014 kevin von flotow
 *
 * executes functions in parallel
 * inspired by node-parallel
 * written to have no dependencies
 */
( function ()
	{
		/** @constructor */
		function Parallel()
		{
			// number of functions that are loaded into this instance
			this.length = 0

			this.finished = 0

			this.err = []

			this.results = []

			this.doneFn = null

			this.isDone = false
		}

		Parallel.prototype.add = function ( fn )
		{
			fn( this.finish.bind( this ) )

			this.length++
		}

		Parallel.prototype.done = function ( fn )
		{
			this.doneFn = fn

			this.doDone()
		}

		Parallel.prototype.doDone = function ()
		{
			if ( !this.isDone && this.length === this.finished )
			{
				this.isDone = true

				if ( this.doneFn )
				{
					this.doneFn( this.err, this.results )
				}
			}
		}

		Parallel.prototype.finish = function ( err, result )
		{
			if ( err )
			{
				this.err.push( err )
			}

			if ( result )
			{
				this.results.push( result )
			}

			this.finished++

			this.doDone()
		}

		module.exports = Parallel
	}
)()
