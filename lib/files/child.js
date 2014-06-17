( function ()
	{
		var PATH = require( 'path' )

		var FS = require( 'fs' )

		var PROCECUTOR = require( PATH.join( __dirname, '../', 'constructors', 'Procecutor' ) ).child

		function _mkdirCheck( data, done )
		{
			data.push( done )

			FS.exists( data[ 0 ] || null, function ( exists )
				{
					if ( exists )
					{
						return done( 'mkdir: directory already exists' )
					}

					FS.mkdir.apply( null, data )
				}
			)
		}

		function _fn( data, done )
		{
			if ( !FS.hasOwnProperty( data.fn ) || typeof FS[ data.fn ] !== 'function' )
			{
				return done( 'invalid function' )
			}

			data.args = data.args || []

			data.args.push( done )

			FS[ data.fn ].apply( null, data.args )
		}

		PROCECUTOR
			.on( 'fn', _fn )
	}
)()
