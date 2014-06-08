/** nodebee cryptography child process
 *  2014 kevin von flotow
 *
 *  processes cryptography in a separate thread
 *  forked by crypt module
 */
( function ()
	{
		var UTIL = require( 'util' )
		
		var PATH = require( 'path' )

		var CRYPTO = require( 'crypto' )

		var CRYPT = require( PATH.join( __dirname, 'index' ) )

		var NBCONFIG = JSON.parse( process.env.NBCONFIG )

		/** @constructor */
		function CryptProcess()
		{
			
		}

		CryptProcess.prototype.process = function ( fn, uid, data )
		{
			data.uid = uid

			data.fn = fn

			process.send( data )

			// exit the process
			process.exit()
		}

		CryptProcess.prototype._listeners = {
			'encrypt': function ( uid, key, data )
			{
				var keyBuf = new Buffer( key + process.env.NBKEY, 'hex' ),

					cipher = CRYPTO.createCipher( NBCONFIG.file_encryption_algorithm, keyBuf ),

					buf = new Buffer( data, 'utf8' )

				cipher.setEncoding( 'binary' )

				cipher.write( buf, 'utf8' )

				var encrypted = cipher.read()

				var fin = cipher.final( 'binary' )

				if ( fin )
				{
					encrypted += fin
				}

				//CryptProcess.prototype._listeners.decrypt.call( this, uid, collectionName, toSend )

				this.process( 'encrypt', uid,
					{
						key: uid,

						data: encrypted
					}
				)
			}/*,

			'decrypt': function ( uid, items )
			{
				var toSend = []

				items = items || []

				for ( var i = 0, l = items.length; i < l; ++i )
				{
					var c = items[ i ],

						keyBuf = new Buffer( c.key + process.env.NBKEY, 'hex' ),

						decipher = CRYPTO.createDecipher( NBCONFIG.file_encryption_algorithm, keyBuf ),

						buf = new Buffer( c.data, 'binary' )

					decipher.setEncoding( 'utf8' )

					decipher.write( buf, 'binary' )

					var decrypted = decipher.read()

					var fin = decipher.final( 'utf8' )

					if ( fin )
					{
						decrypted += fin
					}

					toSend.push(
						{
							key: c.key,

							data: decrypted
						}
					)
				}

				this.process( 'decrypt', uid, collectionName,
					{
						items: toSend
					}
				)
			} */
		}
		
		var CRYPT_PROCESS = new CryptProcess()
		
		process.on( 'message', function ( message, handler )
			{
				// make sure message is an object
				message = message || {}
				
				// break out if we shouldn't be here
				if ( !message.fn || !CRYPT_PROCESS._listeners[ message.fn ] )
				{
					return
				}

				CRYPT_PROCESS._listeners[ message.fn ].call( CRYPT_PROCESS, message.uid, message.key, message.data )
			}
		)
	}
)()
