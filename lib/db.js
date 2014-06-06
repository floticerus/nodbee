/** nodebee db module
 *  2014 kevin von flotow
 */
( function ()
    {
        var FS = require( 'fs' )

        var PATH = require( 'path' )

        var ROOT = PATH.join( __dirname, '../' )

        var DB_DIR = PATH.join( ROOT, 'db' )

        var CRYPT = require( PATH.join( ROOT, 'lib', 'crypt' ) )

        var Collection = require( PATH.join( ROOT, 'lib', 'constructors', 'Collection' ) )

        // regex for scanning .bee files
        var BEE_REGEX = /^(.*?)\.bee$/

        /* new Collection( 'test', function ( collection )
            {
                console.log( collection )
            }
        ) */

        // .bee decryption function, keep out of nodebee classes for security
        // keep this synchronous for now
        function nodebeeDecrypt( file, key )
        {
            // no encryption yet, just parse and return for now

            // add .bee extension to filename
            file = file + '.bee'

            // return false if file doesn't exist
            if ( !FS.existsSync( file ) )
            {
                return false
            }

            // get raw contents of the file
            var contents = FS.readFileSync( file,
                {
                    // use utf8 encoding
                    encoding: 'utf8'
                }
            )

            // parse file contents as JSON and return
            return JSON.parse( contents )
        }

        function nodebeeEncrypt()
        {
            
        }

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
            
        }

        // scan entire database
        Db.prototype.scan = function ()
        {
            // use synchronous readdir method for now, might switch to async
            var files = FS.readdirSync( DB_DIR )

            // reset
            this.collections = {}

            // use for loop instead of forEach because it's probably faster
            for ( var i = 0, l = files.length; i < l; ++i )
            {
                var file = files[ i ],

                    // look for .bee files
                    matches = file.match( BEE_REGEX )

                if ( !matches || matches.length === 0 )
                {
                    continue
                }

                // attempt to decrypt the file
                var content = nodebeeDecrypt( PATH.join( DB_DIR, matches[ 1 ] ) )

                // make sure decryption didn't fail
                if ( !content )
                {
                    continue
                }

                // make sure content.name is set
                content.name = content.name || ''

                // make sure content.collection is set
                content.collection = content.collection || []

                // check if collection already exists - but it shouldn't
                if ( this.collections.hasOwnProperty( content.name ) )
                {
                    continue
                }

                var collection = new Collection( content.collection )

                // add to db
                this.collections[ content.name ] = collection
            }
        } 

        // export instance of Db
        module.exports = new Db()
    }
)()
