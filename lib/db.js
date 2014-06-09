/** nodebee db module
 *  2014 kevin von flotow
 */
( function ()
    {
        var FS = require( 'fs' )

        var PATH = require( 'path' )

        var DB_DIR = PATH.join( __dirname, '../', 'db' )

        var NBCONFIG = JSON.parse( process.env.NBCONFIG )

        // var CRYPT = require( PATH.join( __dirname, 'lib', 'crypt' ) )

        var FILES = require( PATH.join( __dirname, 'files' ) )

        var COMPRESSION = require( PATH.join( __dirname, 'compression' ) )

        var Collection = require( PATH.join( __dirname, 'constructors', 'Collection' ) )

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
            //this.decompress( COLLECTIONS_PATH )
            //COMPRESSION.compress( COLLECTIONS_PATH )
        }

        // compress database files
        // 
        

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
