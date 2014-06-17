/** nodbee server collection class
 *  2014 kevin von flotow
 */
( function ()
	{
		var CLUSTER = require( 'cluster' )

		if ( !CLUSTER.isMaster )
		{
			return
		}

		var FS = require( 'fs' )

		var UTIL = require( 'util' )

		var PATH = require( 'path' )

		var CRYPTO = require( 'crypto' )

		var NBCONFIG = JSON.parse( process.env.NBCONFIG )

		var Uid = require( PATH.join( __dirname, '../', 'Uid' ) )

		var Queue = require( PATH.join( __dirname, '../', 'Queue' ) )

		var QUEUE = new Queue( NBCONFIG.max_files_open )

		// communication with master node
		var MESSAGES = require( PATH.join( __dirname, '../', '../', 'messages' ) )

		var FILES = require( PATH.join( __dirname, '../', '../', 'files' ) )

		var CRYPT = require( PATH.join( __dirname, '../', '../', 'crypt' ) )

		var DB_DIR = PATH.join( __dirname, '../', '../', '../', 'db' )

		var STAGING_DIR = PATH.join( DB_DIR, 'collections', 'staging' )

		// declare outside of class
		var INDICES = {}

		var COLLECTIONS = {}

		function noop(){}

		/** @constructor */
		function Collection( name, callback )
		{
			callback = callback || noop

			if ( !name || name === '' )
			{
				return callback( 'must provide a name for the collection', false )
			}

			// return collection if name already exists
			// make sure to index all files at boot,
			// before running this
			if ( COLLECTIONS[ name ] )
			{
				return callback( 'collection name already exists', false )
			}

			this.name = name

			MESSAGES.emit( 'collection_new', this )

			COLLECTIONS[ this.name ] = this

			// generate index for _id field
			// this.buildIndex( '_id' )

			if ( callback )
			{
				callback( null, this )
			}
		}

		Collection.find = function ( collectionName )
		{
			return COLLECTIONS[ collectionName ] ? COLLECTIONS[ collectionName ] : false
		}

		Collection.prototype.add = function ()
		{

		}

		// collection instance methods

		// chainable
		Collection.prototype.buildIndex = function ( fieldName )
		{
			// make sure this collection exists in the INDICES object
			if ( !INDICES[ this.name ] )
			{
				INDICES[ this.name ] = {}
			}

			// clear the index if it exists
			INDICES[ this.name ][ fieldName ] = {}

			for ( var i = 0, l = this.length; i < l; ++i )
			{
				if ( !this[ i ].hasOwnProperty( fieldName ) )
				{
					continue
				}

				if ( !INDICES[ this.name ][ fieldName ][ this[ i ][ fieldName ] ] )
				{
					INDICES[ this.name ][ fieldName ][ this[ i ][ fieldName ] ] = []
				}

				INDICES[ this.name ][ fieldName ][ this[ i ][ fieldName ] ].push( i )
				//INDICES[ this.name ][ fieldName ][ this[ i ][ fieldName ] ] = i
			}

			return this
		}

		// fn parameters are ( document, index )
		Collection.prototype.each = function ( fn )
		{
			for ( var i = 0, l = this.length; i < l; ++i )
			{
				fn( this[ i ], i )
			}
		}

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
		}

		// chainable if callback is passed, returns single document, or false if not found
		Collection.prototype.findById = function ( id, done )
		{
			var ret = INDICES[ this.name ]._id.hasOwnProperty( id ) ? this[ INDICES[ this.name ]._id[ id ] ] : false

			if ( done )
			{
				done( ret )

				return this
			}
			else
			{
				return ret
			}
		}

		// chainable
		Collection.prototype.findOne = function ( selector, done )
		{
			selector = selector || {}
		}

		// chainable - erases ALL documents within collection
		Collection.prototype.purge = function ()
		{
			return this
		}

		// make sure the staging file doesn't exist
		function genUid ( callback )
		{
			var uid = Uid.gen( 16, true )

			var collectionFile = PATH.join( STAGING_DIR, uid )

			FS.exists( collectionFile, function ( exists )
				{
					if ( exists )
					{
						return genUid( callback )
					}

					callback( uid, collectionFile )
				}
			)
		}

		MESSAGES
			.on( 'collection_new', function ( data )
				{
					/* if ( !data.name )
					{
						return
					}

					if ( COLLECTIONS[ data.name ] )
					{
						// collection exists
						return
					} */

					if ( !( data instanceof Collection ) )
					{
						return new Collection( data.name, function ( err )
							{
								if ( err )
								{
									// console.log( err )
								}
							}
						)
					}

					genUid( function ( uid, collectionFile )
						{
							// make the data available now
							MESSAGES.emit( 'collection_add', data )

							// write in the background and hope all goes well
							QUEUE.add( function ( next )
								{
									FILES.writeBinary( collectionFile, JSON.stringify( data ), function ( err )
										{
											if ( err )
											{
												console.log( err )

												return next( err )
											}

											// write finished
											next()
										}
									)
								}
							)
						}
					)
				}
			)

		module.exports = Collection
	}
)()
