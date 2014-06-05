/** nodebee server collection class
 *  2014 kevin von flotow
 */
( function ()
	{
		var UTIL = require( 'util' )

		var PATH = require( 'path' )

		var UID = require( PATH.join( __dirname, 'uid' ) )

		// var DB_DIR = PATH.join( __dirname, '../', 'db' )

		/** @constructor */
		function Collection( name, collection, callback )
		{
			if ( !callback && Object.prototype.toString.call( collection ) === '[object Function]' )
			{
				callback = collection

				collection = []
			}

			collection = collection || []

			// set base length as 0
			this.length = 0

			this.indices = {}

			if ( !collection || ( UTIL.isArray( collection ) && collection.length === 0 ) )
			{
				collection = ( collection || '' ).toString()

				// no collection passed, generate a new one
				// console.log( collection )
			}
			else if ( UTIL.isArray( collection ) )
			{
				// copy length from collection
				this.length = collection.length

				// loop over collection array
				for ( var i = 0, l = this.length; i < l; ++i )
				{
					// copy
					this[ i ] = collection[ i ]

					// populate _id field is it wasn't passed to collection
					if ( !this[ i ].hasOwnProperty( '_id' ) )
					{
						this[ i ]._id = UID.add()
					}
				}
			}

			// generate index for _id field
			this.buildIndex( '_id' )

			if ( callback )
			{
				callback( this )
			}
		}

		// find by collection name (string)
		Collection.find = function ( str )
		{

		}

		Collection.prototype.add = function ()
		{

		}

		// collection instance methods

		// chainable
		Collection.prototype.buildIndex = function ( fieldName )
		{
			// clear the index if it exists
			this.indices[ fieldName ] = {}

			for ( var i = 0, l = this.length; i < l; ++i )
			{
				if ( !this[ i ].hasOwnProperty( fieldName ) )
				{
					continue
				}

				if ( !this.indices[ fieldName ][ this[ i ][ fieldName ] ] )
				{
					this.indices[ fieldName ][ this[ i ][ fieldName ] ] = []
				}

				this.indices[ fieldName ][ this[ i ][ fieldName ] ].push( i )
				//this.indices[ fieldName ][ this[ i ][ fieldName ] ] = i
			}

			return this
		},

		// fn parameters are ( document, index )
		Collection.prototype.each = function ( fn )
		{
			for ( var i = 0, l = this.length; i < l; ++i )
			{
				fn( this[ i ], i )
			}
		},

		// chainable if callback is passed - callback format is function( results )
		Collection.prototype.find = function ( selector, done )
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
		Collection.prototype.findById = function ( id, done )
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
		Collection.prototype.findOne = function ( selector, done )
		{
			selector = selector || {}
		},

		// chainable - erases ALL documents within collection
		Collection.prototype.purge = function ()
		{
			return this
		}

		module.exports = Collection
	}
)()
