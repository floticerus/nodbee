/** nodebee files module
 *  2014 kevin von flotow
 */
 ( function ()
    {
        var FS = require( 'fs' )

        var PATH = require( 'path' )

        var JS_REGEX = /^(.*?)\.js$/

        var FILES = {}

        /** @constructor */
        function Files()
        {
            
        }

        Files.prototype.mkdir = function ( dir, mode )
        {
            if ( dir && !FS.existsSync( dir ) )
            {
                mode = mode || 0440

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
            // 0000 - read-only
            // 0600 - read/write for owner only
            FS.writeFile( filename, content + '\r\n', { 'encoding': 'binary', 'mode': 0600 }, callback )
        }

        module.exports = new Files()
    }
)()
