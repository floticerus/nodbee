/** nodbee cluster master
 *  2014 kevin von flotow
 *
 *  forks number of workers equal to number
 *  of CPUs and reloads them on crash
 */
 ( function ()
    {
        var CLUSTER = require( 'cluster' )
        
        // return if not master
        if ( !CLUSTER.isMaster )
        {
            return
        }
        
        var PATH = require( 'path' )

        CLUSTER.setupMaster(
            {
                exec: PATH.join( __dirname, 'worker.js' )
            }
        )

        var OS = require( 'os' )

        var FS = require( 'fs' )

        var KEY_PATH = PATH.join( __dirname, '.nbkey' )

        var NBCONFIG_DEFAULT = require( PATH.join( __dirname, 'nbconfig.default.json' ) )

        var NBCONFIG_PATH = PATH.join( __dirname, 'nbconfig.json' )

        // look for nbconfig
        if ( !FS.existsSync( NBCONFIG_PATH ) )
        {
            // no nbconfig.json file, copy from nbconfig.default.json
            FS.writeFileSync( NBCONFIG_PATH, JSON.stringify( NBCONFIG_DEFAULT, null, 4 ) + '\r\n' )
        }

        var NBCONFIG = require( NBCONFIG_PATH )

        // look for new defaults
        ;( function ()
            {
                var newKeys = false

                for ( var key in NBCONFIG_DEFAULT )
                {
                    if ( !NBCONFIG.hasOwnProperty( key ) )
                    {
                        newKeys = true

                        NBCONFIG[ key ] = NBCONFIG_DEFAULT[ key ]
                    }
                }

                if ( newKeys )
                {
                    // write new file
                    FS.writeFileSync( NBCONFIG_PATH, JSON.stringify( NBCONFIG, null, 4 ) ) + '\r\n'
                }
            }
        )()

        var NBCONFIG_STRING = JSON.stringify( NBCONFIG )

        process.env[ 'NBCONFIG' ] = NBCONFIG_STRING

        // need Uid constructor for .nbkey creation
        var Uid = require( PATH.join( __dirname, 'lib', 'constructors', 'Uid' ) )

        // WARNING WARNING WARNING!!!!!
        // deleting or changing .nbkey file will
        // make the database unreadable

        // check for .nbkey file
        // if it doesn't exist, create it
        if ( !FS.existsSync( KEY_PATH ) )
        {
            FS.writeFileSync( KEY_PATH, Uid.gen( 256 ) + '\r\n', { 'encoding': 'binary', 'mode': 0400 } )
        }

        var KEY = FS.readFileSync( KEY_PATH, { 'encoding': 'binary' } ).toString().trim()

        // set NBKEY for master
        process.env[ 'NBKEY' ] = KEY

        // load modules that might require nodbee things from process.env here

        var MESSAGES = require( PATH.join( __dirname, 'lib', 'messages' ) )

        var FILES = require( PATH.join( __dirname, 'lib', 'files' ) )

        var COMPRESSION = require( PATH.join( __dirname, 'lib', 'compression' ) )

        var CRYPT = require( PATH.join( __dirname, 'lib', 'crypt' ) )

        var GENSSL = require( PATH.join( __dirname, 'lib', 'genssl' ) )

        var Queue = require( PATH.join( __dirname, 'lib', 'constructors', 'Queue' ) )

        var DB = require( PATH.join( __dirname, 'lib', 'db' ) )

        var Collection = require( PATH.join( __dirname, 'lib', 'constructors', 'Collection' ) )

        var Procecutor = require( PATH.join( __dirname, 'lib', 'constructors', 'Procecutor' ) )

        // make sure these directories exist before continuing

        FILES.mkdirSync( PATH.join( __dirname, 'db' ) )

        FILES.mkdirSync( PATH.join( __dirname, 'db', 'collections' ) )

        FILES.mkdirSync( PATH.join( __dirname, 'db', 'collections', 'data' ) )

        FILES.mkdirSync( PATH.join( __dirname, 'db', 'collections', 'staging' ) )

        FILES.mkdirSync( PATH.join( __dirname, 'db', 'collections', 'tmp' ) )

        FILES.mkdirSync( PATH.join( __dirname, 'db', 'data' ) )

        FILES.mkdirSync( PATH.join( __dirname, 'db', 'data', 'data' ) )

        FILES.mkdirSync( PATH.join( __dirname, 'db', 'data', 'staging' ) )

        FILES.mkdirSync( PATH.join( __dirname, 'db', 'data', 'tmp' ) )

        FILES.mkdirSync( PATH.join( __dirname, 'users' ) )

        /* FILES.exec( 'mkdir', [ 'rjwekfje', 777 ], function ( err )
            {
                console.log( err || 'success' )
            }
        ) */

        // var col = new Collection( 'collection' )

        //console.log( col )

        // test compress & encrypt together

        /* var COMPRESS_PATH = PATH.join( __dirname, 'db', 'collections', 'staging' )

        COMPRESSION.compress( COMPRESS_PATH, function ( err )
            {
                if ( err )
                {
                    return console.log( err )
                }

                console.log( 'totally done with compression' )

                var GZ_PATH = PATH.join( COMPRESS_PATH, '../', 'tmp', 'archive.json.gz' )

                CRYPT.encryptFile( GZ_PATH, function ( success, uid )
                    {
                        if ( !success )
                        {
                            // encryption failed
                            return console.log( 'encryption failed' )
                        }

                        FS.unlink( GZ_PATH, function ( err )
                            {
                                if ( err )
                                {
                                    console.log( err )
                                }

                                var GZ_DIR = PATH.dirname( GZ_PATH )

                                var UID_PATH = PATH.join( GZ_DIR, uid )

                                var MOVE_PATH = PATH.join( GZ_DIR, '../', 'data', uid )

                                // old file removed, move to data directory
                                FS.rename( UID_PATH, MOVE_PATH, function ( err )
                                    {
                                        if ( err )
                                        {
                                            return console.log( err )
                                        }

                                        // file moved to data directory
                                        console.log( 'finished encryption' )
                                    }
                                )
                            }
                        )
                    }
                )
            }
        ) */

        /* var procecutor = new Procecutor(
            {
                path: PATH.join( __dirname, 'client.js' ),

                min: 5,

                max: 20,

                sleep: -1,

                timeout: 60
            }
        )

        var tests = 100

        while ( tests-- > 0 )
        {
            procecutor.exec( 'test',
                {
                    'test': 'data'
                },
                function ( err, data )
                {
                    if ( err )
                    {
                        return console.log( err )
                    }

                    console.log( data )
                }
            )
        } */

        function forkWorker( data )
        {
            var worker = CLUSTER.fork( data )

            worker
                .on( 'listening', function ( address )
                    {
                        // worker listening
                    }
                )

                .on( 'exit', function ( code, signal )
                    {
                        if ( signal )
                        {
                            console.log( 'worker was killed by signal: ' + signal )
                                    
                            // should we fork a new worker here?
                        }
                        else if ( code !== 0 )
                        {
                            console.log( 'worker exited with error code: ' + code )
                                    
                            // worker crashed, fork a new one
                            forkWorker( data )
                        }
                        else
                        {
                            console.log( 'worker success!' )
                        }
                    }
                )
        }

        // extra data to send to worker
        // sets in process.env
        var WORKER_DATA = {
            'NBKEY': KEY,

            'NBCONFIG': NBCONFIG_STRING
        }

        var NUM_CPUS = OS.cpus().length || 1

        var NUM_WORKERS = 1

        if ( NBCONFIG.num_workers === 'auto' )
        {
            NUM_WORKERS = NUM_CPUS
        }
        else if ( typeof NBCONFIG.num_workers !== 'undefined' )
        {
            NUM_WORKERS = parseInt( NBCONFIG.num_workers )
        }

        function forkWorkers()
        {
            for ( var i = 0; i < NUM_WORKERS; ++i )
            {
                forkWorker( WORKER_DATA )
            }

            DB.ready( function ()
                {
                    console.log( 'yo' )

                    for ( var i = 0; i < 1000; ++i )
                    {
                        new Collection( 'fwjekhfwe8fhweu' + i )
                    }
                }
            )
        }

        // check if we should use ssl
        if ( NBCONFIG.ssl_enabled )
        {
            var sslPath = PATH.join( __dirname, '.ssl' )

            FILES.mkdirSync( sslPath )

            GENSSL(
                {
                    'destination': sslPath,

                    'keyLength': 4096,

                    'organization': 'nodbee',

                    'organizationalUnit': 'database'
                },
                // pass forkWorkers are callback
                forkWorkers
            )
        }
        else
        {
            forkWorkers()
        }
    }
)()
