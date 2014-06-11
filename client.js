/** nodebee client module
 *  2014 kevin von flotow
 */
 ( function ()
	{
		var PATH = require( 'path' )

		var PROCECUTOR = require( PATH.join( __dirname, 'lib', 'Constructors', 'Procecutor' ) ).child

		PROCECUTOR.on( 'test', function ( data, done )
			{
				done( null, 'result' )
			}
		)
	}
)()
