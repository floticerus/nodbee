/** nodebee messages master module
 *  2014 kevin von flotow
 *
 *  communication with master node
 */
( function ()
	{
		var CLUSTER = require( 'cluster' )

		var UTIL = require( 'util' )

		var EventEmitter = require( 'events' ).EventEmitter

		/** @constructor */
		function Messages()
		{
			EventEmitter.call( this )

			this.workers = {}

			this.init()
		}

		UTIL.inherits( Messages, EventEmitter )

		Messages.prototype.init = function ()
		{
			for ( var id in CLUSTER.workers )
			{
				this.initWorker( CLUSTER.workers[ id ] )
			}

			// setup master listeners
			this
				.on( 'connected', function ( data )
					{
						console.log( 'connected to message system' )
					}
				)
		}

		Messages.prototype.initWorker = function ( worker )
		{
			if ( !worker )
			{
				return console.log( 'nodebee messages: no worker' )
			}

			// setup worker listeners
			worker
				.on( 'message', function ()
					{

					}
				)
		}

		module.exports = new Messages()
	}
)()
