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
            if ( FS.existsSync( PATH.relative( __dirname, dir ) ) )
            {

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
            var relativePath = PATH.relative( __dirname, dir ),

                files = FS.readdirSync( relativePath )

            for ( var i = 0, l = files.length; i < l; ++i )
            {
                var file = files[ i ],

                    matches = file.match( JS_REGEX )

                if ( !matches || matches.length === 0 )
                {
                    break
                }

                if ( !FILES[ relativePath ] )
                {
                    FILES[ relativePath ] = {}
                }

                FILES[ relativePath ][ matches[ 1 ] ] = require( PATH.join( relativePath, matches[ 1 ] ) )
            }
        }

        Files.prototype.writeBinary = function ( filename, content, callback )
        {
            FS.writeFile( filename, content + '\r\n', { 'encoding': 'binary' }, callback )
        }

        module.exports = new Files()
    }
)()
