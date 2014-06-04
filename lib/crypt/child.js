( function ()
	{
		var UTIL = require( 'util' )
		
		var PATH = require( 'path' )
		
		var EventEmitter = require( 'events' ).EventEmitter
		
		/** @constructor */
		function CryptThread()
		{
			EventEmitter.call( this )
			
			// keep track of how many tasks are running
			this.tasks = 0
		
			// reference to parent server
			//this.server = null
			
			this.init()
		}
		
		UTIL.inherits( CryptThread, EventEmitter )
		
		CryptThread.prototype.init = function ()
		{
			
			
			console.log( 'thread initialized' )
		}
		
		CryptThread.prototype.listeners = {
			'test': function ( data )
			{
				console.log( data )
			}
		}
		
		var cryptThread = new CryptThread()
		
		require( PATH.join( __dirname, 'messages' ) )( cryptThread )
		
		// module.exports = new CryptThread()
	}
)()
