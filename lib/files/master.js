/** nodbee files module
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

        var PATH = require( 'path' )

        var MESSAGES = require( PATH.join( __dirname, '../', 'messages' ) )

        var Procecutor = require( PATH.join( __dirname, '../', 'constructors', 'Procecutor' ) )

        var PROCECUTOR = new Procecutor(
            {
                path: PATH.join( __dirname, 'child' ),

                min: 2,

                max: 8,

                // timeout for slowing down to 1 child process
                sleep: 120, // 2 minutes

                // timeout for individual child processes
                timeout: 30 // 30 seconds
            }
        )

        var JS_REGEX = /^(.*?)\.js$/

        var FILES = {}

        /** @constructor */
        function Files()
        {
            
        }

        // forwards execution to child process pool
        Files.prototype.exec = function ( fn, args, callback )
        {
            if ( !fn )
            {
                return callback( 'must provide an fs method to run' )
            }

            if ( !FS.hasOwnProperty( fn ) )
            {
                return callback( "method '" + fn + "' is not in the fs module" )
            }

            PROCECUTOR.exec( 'fn', { fn: fn, args: args }, callback )
        }

        Files.prototype.mkdirSync = function ( dir, mode )
        {
            if ( dir && !FS.existsSync( dir ) )
            {
                mode = mode || 0777

                // path does not exist, create directory
                // should we change mode? default is 0777 (evil)
                FS.mkdirSync( dir, mode )
            }
        }

        Files.prototype.read = function ( filename, callback )
        {

        }

        Files.prototype.remove = function ( filename, callback )
        {

        }

        Files.prototype.scan = function ( dir )
        {
            var files = FS.readdirSync( dir )

            for ( var i = 0, l = files.length; i < l; ++i )
            {
                var file = files[ i ],

                    matches = file.match( JS_REGEX )

                if ( !matches || matches.length === 0 )
                {
                    break
                }

                if ( !FILES[ dir ] )
                {
                    FILES[ dir ] = {}
                }

                FILES[ dir ][ matches[ 1 ] ] = require( PATH.join( dir, matches[ 1 ] ) )
            }
        }

        Files.prototype.writeBinary = function ( filename, content, callback )
        {
            // 0600 - read/write for owner
            // 0400 - readonly for owner
            this.exec( 'writeFile', [ filename, content + '\r\n', { 'encoding': 'binary', 'mode': 0600 } ], callback )

            // FS.writeFile( filename, content + '\r\n', { 'encoding': 'binary', 'mode': 0600 }, callback )
        }

        var files = new Files()

        MESSAGES
            .on( 'files_exec', function ( data )
                {
                    files.exec( data.fn, data.args, function ()
                        {
                            MESSAGES.sendToWorker( CLUSTER.workers[ data.worker ], 'files_exec_' + data.uid )
                        }
                    )
                }
            )

            .on( 'files_writeBinary', function ( data )
                {
                    files.writeBinary( data.path, data.content, function ()
                        {
                            MESSAGES.sendToWorker( CLUSTER.workers[ data.worker ], 'files_writeBinary_' + data.uid )
                        }
                    )
                }
            )

        module.exports = files
    }
)()
