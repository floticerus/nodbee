/** nodebee messages worker module
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

			this.connected = false

			this.init()
		}

		UTIL.inherits( Messages, EventEmitter )

		Messages.prototype.init = function ()
		{
			( function ( that )
				{
					// setup some listeners
					that
						.on( 'connected', function ()
							{
								that.connected = true
							}
						)
				}
			)( this )
		}

		Messages.prototype.send = function ( eventName, data )
		{
			process.send(
				{
					fn: eventName,

					data: data
				}
			)
		}

		var messages = new Messages()

		process.on( 'message', function ( message )
			{
				if ( !message.fn )
				{
					return
				}

				messages.emit( message.fn, message.data )
			}
		)

		module.exports = messages
	}
)()
