( function ()
	{
		var CLUSTER = require( 'cluster' )

		var PATH = require( 'path' )

		var FS = require( 'fs' )

		var MESSAGES = require( PATH.join( __dirname, '../', 'messages' ) )

		var UID = 0

		/** @constructor */
		function Files()
		{

		}

		Files.prototype.exec = function ( fn, args, callback )
		{
			var uid = ++UID

			MESSAGES
				.once( 'files_exec_' + uid, function ( data )
					{
						if ( callback )
						{
							callback( data.err, data.result )
						}
					}
				)

				.send( 'files_exec',
					{
						fn: fn,

						args: args,

						uid: uid,

						worker: CLUSTER.worker.id
					}
				)
		}

		Files.prototype.mkdirSync = function ( dir, mode )
        {
            if ( dir && !FS.existsSync( dir ) )
            {
                mode = mode || 0777

                // path does not exist, create directory
                // should we change mode? default is 0777 (evil)
                FS.mkdirSync( dir, mode )
            }
        }

        Files.prototype.writeBinary = function ( filename, content, callback )
        {
        	var uid = ++UID

        	MESSAGES
        		.once( 'files_writeBinary_' + uid, function ( data )
        			{
        				if ( callback )
        				{
        					callback( data.err, data.result )
        				}
        			}
        		)

        		.send( 'files_writeBinary',
        			{
        				path: filename,

        				content: content,

        				uid: uid,

        				worker: CLUSTER.worker.id
        			}
        		)
        }

		module.exports = new Files()
	}
)()
