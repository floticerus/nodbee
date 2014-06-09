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
        
        var PATH = require( 'path' )

        CLUSTER.setupMaster(
            {
                exec: PATH.join( __dirname, 'worker.js' )
            }
        )

        var OS = require( 'os' )

        var FS = require( 'fs' )

        var SPAWN = require( 'child_process' ).spawn

        var KEY_PEM = PATH.join( __dirname, '.ssl', 'nb-key.pem' )

        var CSR_PEM = PATH.join( __dirname, '.ssl', 'nb-csr.pem' )

        var CERT_PEM = PATH.join( __dirname, '.ssl', 'nb-cert.pem' )

        var KEY_PATH = PATH.join( __dirname, '.nbkey' )

        var NBCONFIG = require( PATH.join( __dirname, 'nbconfig' ) )

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

        // load modules that might require nodebee things from process.env here

        var MESSAGES = require( PATH.join( __dirname, 'lib', 'messages' ) )

        var FILES = require( PATH.join( __dirname, 'lib', 'files' ) )

        var COMPRESSION = require( PATH.join( __dirname, 'lib', 'compression' ) )

        var Queue = require( PATH.join( __dirname, 'lib', 'constructors', 'Queue' ) )

        var Collection = require( PATH.join( __dirname, 'lib', 'constructors', 'Collection' ) )

        // make sure these directories exist before continuing

        FILES.mkdir( PATH.join( __dirname, '.ssl' ) )

        FILES.mkdir( PATH.join( __dirname, 'db' ) )

        FILES.mkdir( PATH.join( __dirname, 'db', 'collections' ) )

        FILES.mkdir( PATH.join( __dirname, 'db', 'data' ) )

        FILES.mkdir( PATH.join( __dirname, 'users' ) )

        COMPRESSION.compress( PATH.join( __dirname, 'db', 'collections' ) )

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
        }

        // check if we should use ssl
        if ( NBCONFIG.ssl_enabled )
        {
            // ssl enabled, check for nb-key.pem and nb.cert.pem
            // auto-generate if they do not exist

            // use queue to process async functions in order
            // limit queue to 1 process at a time
            var queue = new Queue( 1 )

            queue.add( function ( next )
                {
                    if ( FS.existsSync( KEY_PEM ) )
                    {
                        return next()
                    }

                    var child = SPAWN( 'openssl', [ 'genrsa', '-out', KEY_PEM, '4096' ], { stdio: 'inherit' } )

                    child.on( 'close', function ()
                        {
                            next()
                        }
                    )
                }
            )

            queue.add( function ( next )
                {
                    // check for CERT_PEM too in case CSR_PEM has been removed
                    if ( FS.existsSync( CSR_PEM ) || FS.existsSync( CERT_PEM ) )
                    {
                        return next()
                    }

                    var child = SPAWN( 'openssl', [ 'req', '-new', '-key', KEY_PEM, '-out', CSR_PEM, '-subj', '/C=US/ST=Illinois/L=Chicago/O=Database/OU=NA/CN=nodebee' ], { stdio: 'inherit' } )

                    child.on( 'close', function ()
                        {
                            next()
                        }
                    )
                }
            )

            queue.add( function ( next )
                {
                    if ( FS.existsSync( CERT_PEM ) )
                    {
                        return next()
                    }

                    var child = SPAWN( 'openssl', [ 'x509', '-req', '-in', CSR_PEM, '-signkey', KEY_PEM, '-out', CERT_PEM ], { stdio: 'inherit' } )

                    child.on( 'close', function ()
                        {
                            // remove CSR_PEM, use async unlink
                            FS.unlink( CSR_PEM, function ()
                                {
                                    next()
                                }
                            )
                        }
                    )
                }
            )

            queue.add( forkWorkers )
        }
        else
        {
            forkWorkers()
        }
    }
)()
