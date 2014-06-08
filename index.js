/** nodebee server module
 *  2014 kevin von flotow
 *
 *  usage: node index.js [port]
 *  default port is 2324
 */
( function ()
    {
        // load master or worker module
        require( require( 'path' ).join( __dirname, require( 'cluster' ).isMaster ? 'master' : 'worker' ) )
    }
)()
