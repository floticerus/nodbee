( function ()
	{
		var PATH = require( 'path' )

		var MESSAGES = require( PATH.join( __dirname, '../', '../', 'messages' ) )

		/** @constructor */
		function Collection( name )
		{
			this.name = name

			MESSAGES
				.send( 'collection_new', JSON.parse( JSON.stringify( this ) ), function ( data )
					{
						console.log( data )
					}
				)
		}

		Collection.prototype.init = function ()
		{

		}

		module.exports = Collection
	}
)()
