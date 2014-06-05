/** nodebee messages master module
 *  2014 kevin von flotow
 *
 *  communication with master node
 */
( function ()
	{
		var UTIL = require( 'util' )

		var EventEmitter = require( 'events' ).EventEmitter

		/** @constructor */
		function Messages()
		{
			EventEmitter.call( this )

			this.init()
		}

		UTIL.inherits( Messages, EventEmitter )

		Messages.prototype.init = function ()
		{
			// setup some listeners
			this
				.on( 'connected', function ( data )
					{
						console.log( 'connected to message system' )
					}
				)
		}

		module.exports = new Messages()
	}
)()
