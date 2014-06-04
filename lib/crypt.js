( function ()
	{
		var UTIL = require( 'util' )

		var PATH = require( 'path' )

		var CHILD_PROCESS = require( 'child_process' )

		// make reference to path so it doesn't run every time
		var CHILD_PATH = PATH.join( __dirname, 'crypt', 'child.js' )

		// EventEmitter class
		var EventEmitter = require( 'events' ).EventEmitter
	
		// number of threads to autorun
		//
		// will need to make this more easily adjustable later
		// adjusting this on more powerful computers might
		// boost performance when accessing multiple files
		var THREADS = 2

		/** @constructor */
		function Crypts( amount )
		{
			EventEmitter.call( this )
		
			// keep track of how many crypt threads are running
			this.length = 0
			
			// see if we should autorun some children threads
			if ( typeof amount !== 'undefined' )
			{
				this.add( amount )
			}
		}
		
		UTIL.inherits( Crypts, EventEmitter )
		
		Crypts.prototype.add = function ( amount )
		{
			// see if we should loop or add a child thread
			if ( typeof amount !== 'undefined' )
			{
				// loop and spawn the appropriate amount of children threads
				for ( var i = 0; i < amount; ++i )
				{
					this.add()
				}
			}
			else
			{	
				// no amount given, create child thread
				var child = CHILD_PROCESS.fork( CHILD_PATH )
				
				child.send(
					{
						'name': 'nodebee_test',
						
						'data':
						{
							'hey': 'test'
						}
					}
				)

				// reference child in this instance and increase length
				this[ this.length++ ] = child
			}
		}

		// message listeners for this instance
		Crypts.prototype.listeners = {
			'test': function ( data )
			{
				console.log( data )
			}
		}
			
		Crypts.prototype.remove = function ( pid )
		{
			for ( var i = 0, l = this.length; i < l; ++i )
			{
				if ( this[ i ].pid === pid )
				{
						
						
					break
				}
			}
		}
			
		Crypts.prototype.removeAll = function ()
		{
			for ( var i = 0, l = this.length; i < l; ++i )
			{
				this.remove( this[ i ].pid )
			}
		}

		var crypts = new Crypts( THREADS )
		
		require( PATH.join( __dirname, 'crypt', 'messages' ) )( crypts )
		
		module.exports = crypts
	}
)()
