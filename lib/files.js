/** nodebee files module
 *  2014 kevin von flotow
 */
 ( function ()
    {
        var FS = require( 'fs' )

        var PATH = require( 'path' )

        var CRYPT = require( PATH.join( __dirname, 'crypt' ) )

        var JS_REGEX = /^(.*?)\.js$/

        var FILES = {}

        /** @constructor */
        function Files()
        {
            
        }

        Files.prototype.mkdir = function ( dir )
        {
            if ( dir && !FS.existsSync( dir ) )
            {
                // path does not exist, create directory
                // should we change mode? default is 0777 (evil)
                FS.mkdirSync( dir )
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
            FS.writeFile( filename, content + '\r\n', { 'encoding': 'binary' }, callback )
        }

        module.exports = new Files()
    }
)()
