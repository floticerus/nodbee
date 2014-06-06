/** nodebee messages master module
 *  2014 kevin von flotow
 *
 *  communication with worker nodes
 */
( function ()
	{
		var CLUSTER = require( 'cluster' )

		var UTIL = require( 'util' )

		var EventEmitter = require( 'events' ).EventEmitter

		var NUM_WORKERS = 0

		var NUM_LISTENING = 0

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
			
		}

		Messages.prototype.sendToWorker = function ( worker, fn, obj )
		{
			worker.send(
				{
					fn: fn,

					data: obj
				}
			)
		}

		var messages = new Messages()

		CLUSTER.on( 'online', function ( worker, address )
			{
				messages.sendToWorker( worker, 'connected' )

				worker.on( 'message', function ( message )
					{
						if ( !message.fn )
						{
							return
						}

						messages.emit( message.fn, JSON.parse( message.data ) )
					}
				)
			}
		)

		module.exports = messages
	}
)()
