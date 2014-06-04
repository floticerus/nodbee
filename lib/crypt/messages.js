( function ()
	{
		var NODEBEE_REGEX = /^nodebee_([A-Za-z0-9_\-]+)$/
	
		var CREATOR = null
	
		process.on( 'message', function ( message, handler )
			{
				// make sure creator has been set
				if ( !CREATOR || !CREATOR.listeners )
				{
					return
				}
			
				// make sure message is an object
				message = message || {}
				
				// make sure message.name is a string
				message.name = ( message.name || '' ).toString()
				
				// check for and remove nodebee identifier
				var matches = message.name.match( NODEBEE_REGEX )
				
				if ( !matches || matches.length === 0 )
				{
					return
				}
				
				message.name = matches[ 1 ]
				
				// last chance to break out if we shouldn't be here
				if ( !message.name || !CREATOR.listeners[ message.name ] )
				{
					return
				}
				
				CREATOR.listeners[ message.name ]( message.data )
			}
		)
		
		module.exports = function ( obj )
		{
			CREATOR = obj
		}
	}
)()
