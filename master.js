/** nodebee cluster master
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
        
        var OS = require( 'os' )

        var FS = require( 'fs' )

        var PATH = require( 'path' )

        var KEY_DIR = PATH.join( __dirname, '.nbkey' )
        
        var NUM_CPUS = OS.cpus().length || 1

        var NBCONFIG = require( PATH.join( __dirname, 'nbconfig' ) )

        var MESSAGES = require( PATH.join( __dirname, 'lib', 'messages' ) )

        var FILES = require( PATH.join( __dirname, 'lib', 'files' ) )

        var Uid = require( PATH.join( __dirname, 'lib', 'constructors', 'Uid' ) )

        // make sure these directories exist before continuing

        FILES.mkdir( PATH.join( __dirname, 'db' ) )

        FILES.mkdir( PATH.join( __dirname, 'db', 'collections' ) )

        FILES.mkdir( PATH.join( __dirname, 'db', 'data' ) )

        FILES.mkdir( PATH.join( __dirname, 'db', 'links' ) )

        FILES.mkdir( PATH.join( __dirname, 'db', 'links', 'collections' ) )

        FILES.mkdir( PATH.join( __dirname, 'db', 'links', 'data' ) )

        // WARNING WARNING WARNING!!!!!
        // deleting or changing .nbkey file will
        // make the database unreadable

        // check for .nbkey file
        // if it doesn't exist, create it
        if ( !FS.existsSync( KEY_DIR ) )
        {
            FS.writeFileSync( KEY_DIR, Uid.gen( 256 ) + '\r\n', 'binary' )
        }

        var KEY = FS.readFileSync( KEY_DIR, { 'encoding': 'binary' } ).toString().trim()

        // extra data to send to worker
        // sets in process.env
        var workerData = {
            'NBKEY': KEY,

            'NBCONFIG': JSON.stringify( NBCONFIG )
        }

        // set process.env for master, too
        for ( var key in workerData )
        {
            process.env[ key ] = workerData[ key ]
        }

        // load modules that require nodebee things from process.env here

        var Collection = require( PATH.join( __dirname, 'lib', 'constructors', 'Collection' ) )

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

        // lock at 2 threads for now
        for ( var i = 0; i < 2; ++i )
        {
            forkWorker( workerData )
        }
    }
)()
