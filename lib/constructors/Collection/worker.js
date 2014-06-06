( function ()
	{
		var PATH = require( 'path' )

		var MESSAGES = require( PATH.join( __dirname, '../', '../', 'messages' ) )

		/** @constructor */
		function Collection( name )
		{
			this.name = name

			MESSAGES
				.send( 'newcollection', JSON.stringify( this ) )
		}

		Collection.prototype.init = function ()
		{

		}

		module.exports = Collection
	}
)()
