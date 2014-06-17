/** nodbee worker compression module
 *  2014 kevin von flotow
 */
( function ()
	{
		var CLUSTER = require( 'cluster' )

		var PATH = require( 'path' )

		// communication with master node
		var MESSAGES = require( PATH.join( __dirname, '../', 'messages' ) )

		var UID = 0

		function processCompression( fn, path, callback )
		{
			var uid = UID++

			MESSAGES
				.once( 'compression_' + fn + '_' + uid, function ( data )
					{
						if ( callback )
						{
							callback( data.err, data.result )
						}
					}
				)

				.send( 'compress',
					{
						fn: fn,

						path: path,

						uid: uid,

						worker: CLUSTER.worker.id
					}
				)
		}

		/** @constructor */
		function Compression()
		{

		}

		Compression.prototype.compress = function ( path, callback )
		{
			processCompression( 'compress', path, callback )
		}

		Compression.prototype.decompress = function ( path, callback )
		{
			processCompression( 'decompress', path, callback )
		}

		module.exports = new Compression()
	}
)()
