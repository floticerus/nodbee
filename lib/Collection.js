/** nodebee server collection class
 *  2014 kevin von flotow
 */
( function ()
	{
		var UTIL = require( 'util' )

		var PATH = require( 'path' )

		var DB_DIR = PATH.join( __dirname, '../', 'db' )

		/** @constructor */
		function Collection( collection )
		{
			collection = collection || []

			// set base length as 0
			this.length = 0

			this.indices = {}

			// generate index for _id field
			this.buildIndex( '_id' )

			// make sure collection is an array
			if ( UTIL.isArray( collection ) )
			{
				// copy length from collection
				this.length = collection.length

				// loop over collection array
				for ( var i = 0, l = this.length; i < l; ++i )
				{
					// copy
					this[ i ] = collection[ i ]
				}
			}
		}

		// collection instance methods
		Collection.prototype = {
			// chainable
			buildIndex: function ( fieldName )
			{
				// clear the index if it exists
				this.indices[ fieldName ] = {}

				for ( var i = 0, l = this.length; i < l; ++i )
				{
					this.indices[ fieldName ][ this[ i ][ fieldName ] ] = i
				}

				return this
			},

			// fn parameters are ( document, index )
			each: function ( fn )
			{
				for ( var i = 0, l = this.length; i < l; ++i )
				{
					fn( this[ i ], i )
				}
			},

			// chainable if callback is passed - callback format is function( results )
			find: function ( selector, done )
			{
				selector = selector || {}

				var results = []

				for ( var key in selector )
				{
					for ( var i = 0, l = this.length; i < l; ++i )
					{
						if ( this[ i ][ key ] === selector[ key ] )
						{
							results.push( this[ i ] )
						}
					}
				}

				if ( done )
				{
					// callback was passed, execute and return `this`
					done( results )

					return this
				}
				else
				{
					// callback not passed, just return results
					return results
				}
			},

			// chainable if callback is passed, returns single document, or false if not found
			findById: function ( id, done )
			{
				var ret = this.indices._id.hasOwnProperty( id ) ? this[ this.indices._id[ id ] ] : false

				if ( done )
				{
					done( ret )

					return this
				}
				else
				{
					return ret
				}
			},

			// chainable
			findOne: function ( selector, done )
			{
				selector = selector || {}
			},

			// chainable - erases ALL documents within collection
			purge: function ()
			{
				return this
			}
		}

		module.exports = Collection
	}
)()
