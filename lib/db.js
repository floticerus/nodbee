/** nodebee db module
 *  2014 kevin von flotow
 */
( function ()
    {
        var FS = require( 'fs' )

        var PATH = require( 'path' )

        var ROOT = PATH.join( __dirname, '../' )

        var DB_DIR = PATH.join( ROOT, 'db' )

        var NBCONFIG = JSON.parse( process.env.NBCONFIG )

        var CRYPT = require( PATH.join( ROOT, 'lib', 'crypt' ) )

        var Collection = require( PATH.join( ROOT, 'lib', 'constructors', 'Collection' ) )

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

        }

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
