/** nodebee db module
 *  2014 kevin von flotow
 */
( function ()
    {
        var FS = require( 'fs' )

        var PATH = require( 'path' )

        var ZLIB = require( 'zlib' )

        var STREAM = require( 'stream' )

        var DB_DIR = PATH.join( __dirname, '../', 'db' )

        var NBCONFIG = JSON.parse( process.env.NBCONFIG )

        // var CRYPT = require( PATH.join( __dirname, 'lib', 'crypt' ) )

        var FILES = require( PATH.join( __dirname, 'files' ) )

        var Collection = require( PATH.join( __dirname, 'constructors', 'Collection' ) )

        var Queue = require( PATH.join( __dirname, 'constructors', 'Queue' ) )

        var COLLECTIONS_PATH = PATH.join( DB_DIR, 'collections' )

        /** @constructor */
        function Db()
        {
            this.collections = {}

            this.init()

            // scan on start
            this.scan()
        }

        Db.prototype.init = function ()
        {
            // scan all files and populate database
            //this.compress( COLLECTIONS_PATH )
            this.decompress( COLLECTIONS_PATH )
        }

        // compress database files
        // 
        Db.prototype.compress = function ( path, callback )
        {
            callback = callback || function(){}

            FS.exists( path, function ( exists )
                {
                    if ( !exists )
                    {
                        return callback( 'db.compress: path does not exist' )
                    }

                    FS.stat( path, function ( err, stats )
                        {
                            if ( err )
                            {
                                return callback( err )
                            }

                            if ( stats.isDirectory() )
                            {
                                FS.readdir( path, function ( err, files )
                                    {
                                        if ( err )
                                        {
                                            return callback( err )
                                        }

                                        // check for compressed file,
                                        // extract it,
                                        // combine with uncompressed files,
                                        // then compress them all

                                        var data = {},

                                            // 100 files at a time
                                            dataQueue = new Queue( 100 ),

                                            jsonPath = PATH.join( path, 'archive.json' ),

                                            gzPath = jsonPath + '.gz'

                                        for ( var i = 0, l = files.length; i < l; ++i )
                                        {
                                            ( function ( file )
                                                {
                                                    dataQueue.add( function ( next )
                                                        {
                                                            var filePath = PATH.join( path, file )

                                                            FS.readFile( filePath, { 'encoding': 'binary' }, function ( err, contents )
                                                                {
                                                                    data[ file ] = contents.toString().trim()

                                                                    next()
                                                                }
                                                            )
                                                        }
                                                    )
                                                }
                                            )( files[ i ] )
                                        }

                                        dataQueue.done( function ()
                                            {
                                                // write uncompressed .json file
                                                FILES.writeBinary( jsonPath, JSON.stringify( data ), function ( err )
                                                    {
                                                        if ( err )
                                                        {
                                                            return callback( err )
                                                        }

                                                        var gzip = ZLIB.createGzip()

                                                        var inp = FS.createReadStream( jsonPath, { 'encoding': 'binary' } )

                                                        var out = FS.createWriteStream( gzPath, { 'encoding': 'binary', 'mode': 0600 } )

                                                        inp.pipe( gzip ).pipe( out )

                                                        // might want to change this to finish event
                                                        out.on( 'close', function ()
                                                            {
                                                                var unlinkQueue = new Queue()

                                                                // wait until archive is finished writing,
                                                                // then remove individual files using
                                                                // keys from data object
                                                                for ( var key in data )
                                                                {
                                                                    ( function ( keyPath )
                                                                        {
                                                                            unlinkQueue.add( function ( nextUnlink )
                                                                                {
                                                                                    FS.exists( keyPath, function ( exists )
                                                                                        {
                                                                                            if ( !exists )
                                                                                            {
                                                                                                nextUnlink()

                                                                                                return callback( 'db compress: problem unlinking database file: ' + keyPath, false )
                                                                                            }

                                                                                            FS.unlink( keyPath, function ( err )
                                                                                                {
                                                                                                    nextUnlink()

                                                                                                    if ( err )
                                                                                                    {
                                                                                                        return callback( err )
                                                                                                    }
                                                                                                }
                                                                                            )
                                                                                        }
                                                                                    )
                                                                                }
                                                                            )
                                                                        }
                                                                    )( PATH.join( path, key.toString() ) )
                                                                }

                                                                unlinkQueue.add( function ()
                                                                    {
                                                                        FS.exists( jsonPath, function ( exists )
                                                                            {
                                                                                if ( !exists )
                                                                                {
                                                                                    return callback( 'db compress: could not find ' + jsonPath )
                                                                                }

                                                                                FS.unlink( jsonPath, function ( err )
                                                                                    {
                                                                                        return callback( err, gzPath )
                                                                                    }
                                                                                )
                                                                            }
                                                                        )
                                                                    }
                                                                )
                                                            }
                                                        )
                                                    }
                                                )
                                            }
                                        )
                                    }
                                )
                            }
                        }
                    )
                }
            )
        }

        Db.prototype.decompress = function ( path, callback )
        {
            callback = callback || function(){}

            var jsonPath = PATH.join( path, 'archive.json' ),

                gzPath = jsonPath + '.gz'

            FS.exists( gzPath, function ( exists )
                {
                    if ( !exists )
                    {
                        return callback( 'db.decompress: archive does not exist' )
                    }

                    var gunzip = ZLIB.createGunzip()

                    var inp = FS.createReadStream( gzPath )

                    var out = FS.createWriteStream( jsonPath,
                        {
                            'encoding': 'binary',

                            'mode': 0600
                        }
                    )

                    inp.pipe( gunzip ).pipe( out )

                    out.on( 'close', function ()
                        {
                            // gunzip complete
                            FS.exists( jsonPath, function ( exists )
                                {
                                    if ( !exists )
                                    {
                                        return callback( 'db decompress: archive.json not found' )
                                    }

                                    FS.readFile( jsonPath, function ( err, contents )
                                        {
                                            if ( err )
                                            {
                                                return callback( err )
                                            }

                                            var obj = JSON.parse( contents )

                                            var decompressQueue = new Queue( 100 )

                                            for ( var objKey in obj )
                                            {
                                                ( function ( key, val )
                                                    {
                                                        decompressQueue.add( function ( next )
                                                            {
                                                                FILES.writeBinary( PATH.join( path, key ), val, function ( err )
                                                                    {
                                                                        next()
                                                                    }
                                                                )
                                                            }
                                                        )
                                                    }
                                                )( objKey, obj[ objKey ] )
                                            }

                                            decompressQueue.done( function ()
                                                {
                                                    // finished writing
                                                    callback()
                                                }
                                            )
                                        }
                                    )
                                }
                            )
                        }
                    )
                }
            )
        }

        // scan entire database
        Db.prototype.scan = function ()
        {
            if ( !FS.existsSync( DB_DIR ) )
            {
                return
            }

            // use synchronous readdir method for now, might switch to async
            var files = FS.readdirSync( DB_DIR )

            // reset
            this.collections = {}

            // use for loop instead of forEach because it's probably faster
            for ( var i = 0, l = files.length; i < l; ++i )
            {
                var file = files[ i ]


            }
        }

        // export instance of Db
        module.exports = new Db()
    }
)()
