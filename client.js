/** nodebee client module
 *  2014 kevin von flotow
 */
 ( function ()
	{
		var PATH = require( 'path' )

		var PROCECUTOR = require( PATH.join( __dirname, 'lib', 'Constructors', 'Procecutor' ) ).child

		PROCECUTOR.on( 'test', function ( data, done )
			{
				setTimeout( function ()
					{
						done( null, 'result' )
					}, Math.random() * 3000
				)
			}
		)
	}
)()
