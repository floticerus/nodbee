/** nodbee worker compression module
 *  2014 kevin von flotow
 */
( function ()
	{
		var CLUSTER = require( 'cluster' )

		// only master can run this script
		if ( !CLUSTER.isMaster )
		{
			module.exports = false

			return
		}

		var PATH = require( 'path' )

		var MESSAGES = require( PATH.join( __dirname, '../', 'messages' ) )

		var Procecutor = require( PATH.join( __dirname, '../', 'constructors', 'Procecutor' ) )

		var PROCECUTOR = new Procecutor(
			{
				path: PATH.join( __dirname, 'child' ),

				min: 2,

				max: 8,

				sleep: -1, // 10 minutes

				timeout: -1, // 5 minutes

				// ends the process as soon as it returns
				// good for processes that use a lot of memory on each run
				suicide: true
			}
		)

		function _compress( path, callback )
		{
			PROCECUTOR.exec( 'compress', path, callback )
		}

		function _decompress( path, callback )
		{
			PROCECUTOR.exec( 'decompress', path, callback )
		}

		MESSAGES
			.on( 'compress', function ( data )
				{
					_compress( data.path, function ( err )
						{
							if ( err )
							{
								console.log( err )
							}

							MESSAGES.sendToWorker( CLUSTER.workers[ data.worker ], 'compression_compress' + data.uid )
						}
					)
				}
			)

			.on( 'decompress', function ()
				{

				}
			)

		module.exports = {
			compress: _compress,

			decompress: _decompress
		}
	}
)()
