/** nodebee server collection class
 *  2014 kevin von flotow
 */
( function ()
    {
        var FS = require( 'fs' )

        var UTIL = require( 'util' )

        var PATH = require( 'path' )

        var CRYPTO = require( 'crypto' )

        var Uid = require( PATH.join( __dirname, '../', 'Uid' ) )

        var Parallel = require( PATH.join( __dirname, '../', 'Parallel' ) )

        // communication with master node
        var MESSAGES = require( PATH.join( __dirname, '../', '../', 'messages' ) )

        var FILES = require( PATH.join( __dirname, '../', '../', 'files' ) )

        var CRYPT = require( PATH.join( __dirname, '../', '../', 'crypt' ) )

        var UID = new Uid()

        var UID_COLLECTIONS = new Uid( { 'lowercase': true } )

        var DB_DIR = PATH.join( __dirname, '../', '../', '../', 'db' )

        var COLLECTIONS_DIR = PATH.join( DB_DIR, 'collections' )

        // declare outside of class
        var INDICES = {}

        var COLLECTIONS = {}

        /* MESSAGES.on( 'listening', function ()
            {
                console.log( 'TEST' )

                MESSAGES.send( 'test', { 'test': 'test' } )
            }
        ) */

        // var DB_DIR = PATH.join( __dirname, '../', 'db' )

        /** @constructor */
        function Collection( name, collection, callback )
        {
            if ( !callback && Object.prototype.toString.call( collection ) === '[object Function]' )
            {
                callback = collection

                collection = []
            }

            name = name || ''

            // return collection if name already exists
            // make sure to index all files at boot,
            // before running this
            if ( COLLECTIONS[ name ] )
            {
                callback( null, COLLECTIONS[ name ] )

                return COLLECTIONS[ name ]
            }

            this.name = name

            this.items = []

            COLLECTIONS[ this.name ] = this

            collection = collection || []

            // set base length as 0
            this.length = 0

            var uid = UID_COLLECTIONS.add( 128 )

            // MESSAGES.emit( 'newcollection', JSON.stringify( this ) )

            // INDICES[ this._id ] = {}

            /* if ( !collection || ( UTIL.isArray( collection ) && collection.length === 0 ) )
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
            } */

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

        Collection.prototype.create = function ()
        {
            COLLECTIONS[ this.name ] = this

            // var json = JSON.stringify( this )


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

        MESSAGES
            .on( 'newcollection', function ( data )
                {
                    if ( !data.name )
                    {
                        return
                    }

                    if ( COLLECTIONS[ data.name ] )
                    {
                        // collection exists
                        return
                    }

                    var uid = UID_COLLECTIONS.add( 16 ),

                        collectionFile = PATH.join( COLLECTIONS_DIR, uid )

                    // make damn sure the id isn't taken
                    while ( FS.existsSync( collectionFile ) )
                    {
                        uid = UID_COLLECTIONS.add( 16 )

                        collectionFile = PATH.join( COLLECTIONS_DIR, uid )
                    }

                    // uid += process.env.NBKEY

                    // check for NBCONFIG.file_async. if file_async is true,
                    // return data before the file is encrypted and written
                    // potentially dangerous when reliability is critical

                    // encrypt data
                    CRYPT.encrypt( uid, JSON.stringify( data ), function ( encrypted )
                        {
                            FILES.writeBinary( collectionFile, encrypted.data, function ( err )
                                {
                                    if ( err )
                                    {
                                        done( err )

                                        return console.log( err )
                                    }

                                    // write finished
                                }
                            )
                        }
                    )
                }
            )

        module.exports = Collection
    }
)()
