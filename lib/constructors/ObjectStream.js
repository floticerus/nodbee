( function ()
	{
		var UTIL = require( 'util' )

		var Transform = require( 'stream' ).Transform

		/** @constructor */
		function ObjectStream( opts )
		{
			Transform.call( this, opts )

			this.json = ''
		}

		UTIL.inherits( ObjectStream, Transform )

		ObjectStream.prototype._transform = function ( chunk, encoding, callback )
		{
			chunk = chunk.toString()

			this.json += chunk

			callback()
		}

		ObjectStream.prototype._flush = function ( callback )
		{
			//console.log( this.json )

			// make sure it's valid, and make it a string
			var json = JSON.stringify( JSON.parse( this.json ) )

			var buf = new Buffer( json, 'utf8' )

			this.push( buf )

			callback()
		}

		module.exports = ObjectStream
	}
)()
