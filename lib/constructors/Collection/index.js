/** nodbee messages module
 *  2014 kevin von flotow
 */
( function ()
	{
		// load master or worker module
		module.exports = require( require( 'path' ).join( __dirname, require( 'cluster' ).isMaster ? 'master' : 'worker' ) )
	}
)()
