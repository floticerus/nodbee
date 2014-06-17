/** nodbee cryptography child process
 *  2014 kevin von flotow
 *
 */
( function ()
	{
		var FS = require( 'fs' )

		var UTIL = require( 'util' )
		
		var PATH = require( 'path' )

		var CRYPTO = require( 'crypto' )

		var ZLIB = require( 'zlib' )

		var PROCECUTOR = require( PATH.join( __dirname, '../', 'constructors', 'Procecutor' ) ).child

		var ObjectStream = require( PATH.join( __dirname, '../', 'constructors', 'ObjectStream' ) )

		var NBCONFIG = JSON.parse( process.env.NBCONFIG )

		function _makeHash( str )
        {
            return CRYPTO.createHash( NBCONFIG.hash_algorithm ).update( str.toString() + process.env.NBKEY ).digest( 'hex' )
        }

        function _testHash( str, hashed )
        {
            return _makeHash( str ) === hashed
        }

		function _encrypt( uid, data, callback )
		{
			var key = _makeHash( uid )

			var keyBuf = new Buffer( key, 'hex' )

			var cipher = CRYPTO.createCipher( NBCONFIG.file_encryption_algorithm, keyBuf )

			var buf = new Buffer( data, 'utf8' )

			cipher.setEncoding( 'binary' )

			cipher.write( buf, 'utf8' )

			var encrypted = cipher.read()

			var fin = cipher.final( 'binary' )

			if ( fin )
			{
				encrypted += fin
			}

			callback( null, encrypted )
		}

		function _encryptFile( uid, path, callback )
		{
			FS.open( path, 'r', function ( err, fd )
				{
					if ( err )
					{
						return callback( err )
					}

					var key = _makeHash( uid )

					// file exists, encrypt it
					var keyBuf = new Buffer( key, 'hex' )

					var cipher = CRYPTO.createCipher( NBCONFIG.file_encryption_algorithm, keyBuf )

					var outPath = PATH.join( PATH.dirname( path ), uid )

					var inp = FS.createReadStream( path, { encoding: 'binary', mode: 0600, fd: fd } )

					var out = FS.createWriteStream( outPath, { encoding: 'binary', mode: 0600 } )

					// pipe to cipher and then out to file
					inp.pipe( cipher ).pipe( out )

					out.on( 'close', function ( err )
						{
							callback( err, true )
						}
					)
				}
			)
		}

		function _decryptFile( uid, path, out, callback )
		{
			FS.open( path, 'r', function ( err, fd )
				{
					if ( err )
					{
						return callback( err )
					}

					var key = _makeHash( uid )

					var keyBuf = new Buffer( key, 'hex' )

					var decipher = CRYPTO.createDecipher( NBCONFIG.file_encryption_algorithm, keyBuf )

					var inp = FS.createReadStream( path, { encoding: 'binary', mode: 0600, fd: fd } )

					var output = FS.createWriteStream( out, { encoding: 'binary', mode: 0600 } )

					inp.pipe( decipher ).pipe( output )

					output.on( 'close', function ( err )
						{
							callback( err, true )
						}
					)
				}
			)
		}

		// pass object in callback
		function _decryptFileToObject( uid, path, callback )
		{
			FS.open( path, 'r', function ( err, fd )
				{
					if ( err )
					{
						return callback( err )
					}

					var key = _makeHash( uid )

					var keyBuf = new Buffer( key, 'hex' )

					var decipher = CRYPTO.createDecipher( NBCONFIG.file_encryption_algorithm, keyBuf )

					var inp = FS.createReadStream( path, { encoding: 'binary', mode: 0600, fd: fd } )

					//var gunzip = ZLIB.createGunzip()

					var output = new ObjectStream( { encoding: 'utf8' } )

					inp.pipe( decipher ).pipe( output ) //.pipe( output )

					var ret = null

					output.on( 'data', function ( data )
						{
							output.end()

							callback( null, data )
						}
					)
				}
			)
		}
		
		PROCECUTOR
			.on( 'encrypt', function ( data, done )
				{
					_encrypt( data.uid, data.data, function ( err, encrypted )
						{
							done( err, encrypted )
						}
					)
				}
			)

			.on( 'decrypt', function ( data, done )
				{

				}
			)

			.on( 'encryptFile', function ( data, done )
				{
					_encryptFile( data.uid, data.data, function ( err, success )
						{
							done( err, success )
						}
					)
				}
			)

			.on( 'decryptFile', function ( data, done )
				{
					_decryptFile( data.uid, data.path, data.out, function ( err, success )
						{
							done( err, success )
						}
					)
				}
			)

			.on( 'decryptFileToObject', function ( data, done )
				{
					_decryptFileToObject( data.uid, data.path, function ( err, result )
						{
							done( err, result )
						}
					)
				}
			)
	}
)()
