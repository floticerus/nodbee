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

		Messages.prototype.send = function ( name, data )
		{
			process.send(
				{
					name: name,

					data: data
				}
			)
		}

		var messages = new Messages()

		process.on( 'message', function ( message )
			{
				if ( !message.name )
				{
					return
				}

				messages.emit( message.name, JSON.stringify( message.data ) )
			}
		)

		module.exports = messages
	}
)()
