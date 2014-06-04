( function ()
	{
		var FS = require( 'fs' ),

			PATH = require( 'path' ),

			JS_REGEX = /^(.*?)\.js$/

		FS.readdirSync( __dirname ).forEach( function ( file )
			{
				var matches = file.match( JS_REGEX )

				if ( !matches || matches.length === 0 || matches[ 1 ] === 'index' )
				{
					return false
				}

				// auto require
				exports[ matches[ 1 ] ] = require( PATH.join( __dirname, matches[ 1 ] ) )
			}
		)
	}
)()
