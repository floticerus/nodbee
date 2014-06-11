/** nodbee cluster worker
 *  2014 kevin von flotow
 */
( function ()
    {
        var CLUSTER = require( 'cluster' )
        
        // return if not worker
        if ( !CLUSTER.isWorker )
        {
            return
        }
        
        var FS = require( 'fs' )

        var PATH = require( 'path' )

        var NBCONFIG = JSON.parse( process.env.NBCONFIG )

        var KEY_PEM = PATH.join( __dirname, '.ssl', 'nb-key.pem' )

        var CERT_PEM = PATH.join( __dirname, '.ssl', 'nb-cert.pem' )

        var MESSAGES = require( PATH.join( __dirname, 'lib', 'messages' ) )

        var Collection = require( PATH.join( __dirname, 'lib', 'constructors', 'Collection' ) )

        // reference Socket class
        var Socket = require( PATH.join( __dirname, 'lib', 'constructors', 'Socket' ) )

        MESSAGES
            // wait for connection with message system
            .on( 'connected', function ()
                {
                    //var col = new Collection( 'testcollection' )

                    //console.log( col )

                    //for ( var i = 0; i < 2000; ++i )
                    //{
                    //    new Collection( 'fwjekhfwe8fhweu' )
                    //}
                }
            )

        // get default port from nbconfig, if it isn't available, set as 2324
        var PORT = typeof NBCONFIG.port !== 'undefined' ? NBCONFIG.port : 2324

        // override port from the command line
        if ( process.argv.length > 2 )
        {
            // use the first argument
            PORT = process.argv[ 2 ]
        }

        var SERVER, SERVER_OPTS

        if ( NBCONFIG.ssl_enabled )
        {
            SERVER = require( 'tls' )

            SERVER_OPTS = {
                key: FS.readFileSync( KEY_PEM ),

                cert: FS.readFileSync( CERT_PEM )
            }
        }
        else
        {
            SERVER = require( 'net' )

            SERVER_OPTS = {
                allowHalfOpen: true
            }
        }

        // create server
        var server = SERVER.createServer( SERVER_OPTS )

        // listen for connections
        server.on( 'connection', function ( socket )
            {
                new Socket( socket )
            }
        )

        // bind server to port
        server.listen( PORT, function ()
            {
                // server is bound
                console.log( 'nodbee worker listening on port ' + PORT )
            }
        )
        
        /* process.on( 'uncaughtException', function ( msg, data )
            {
                console.log( msg )
                
                console.log( data )
                
                process.kill()
            }
        ) */
    }
)()
