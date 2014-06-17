/** nodbee child compression module
 *  2014 kevin von flotow
 *
 *  this process is spawned by Procecutor with suicide option enabled
 */
( function ()
	{
		var PATH = require( 'path' )

		var FS = require( 'fs' )

		var PROCECUTOR = require( PATH.join( __dirname, '../', 'constructors', 'Procecutor' ) ).child

		var CRYPT = require( PATH.join( __dirname, '../', 'crypt' ) )

		var Queue = require( PATH.join( __dirname, '../', 'constructors', 'Queue' ) )

		var ZLIB = require( 'zlib' )

		function noop(){}

		function addToInnerQueue( innerQueue, fileData, filePath, callback )
		{
			callback = callback || noop

			innerQueue.add( function ( nextInner )
				{
					CRYPT.decryptFileToObject( filePath, function ( err, result )
						{
							if ( err )
							{
								return callback( err )
							}

							for ( var key in result )
							{
								fileData[ key ] = result[ key ]
							}

							nextInner()

							callback( null )
						}
					)
				}
			)
		}

		function addToDataQueue( dataQueue, unlinkQueue, fileData, filename, filePath, callback )
		{
			callback = callback || noop

			dataQueue.add( function ( next )
				{
					FS.readFile( filePath, { encoding: 'binary' }, function ( err, contents )
						{
							if ( err )
							{
								return callback( err )
							}

							fileData[ filename ] = JSON.parse( contents )

							// add this file to the unlink queue,
							// this allows unlinks to happen in the
							// background while compression continues
							unlinkQueue.add( function ( nextUnlink )
								{
									// async unlink
									FS.unlink( filePath, function ( err )
										{
											if ( err )
											{
												return callback( err )
											}

											nextUnlink()
										}
									)
								}
							)

							next()

							callback( null )
						}
					)
				}
			)
		}

		function addToDecompressQueue( decompressQueue, filePath, callback )
		{
			callback = callback || noop

			decompressQueue.add( function ( next )
				{
					FS.writeFile( filePath, val, { 'encoding': 'binary' }, function ( err )
						{
							if ( err )
							{
								return callback( err )
							}

							next()

							callback( null )
						}
					)
				}
			)
		}

		function _compress( path, done )
		{
			var stagingPath = PATH.join( path, 'staging' )

			FS.stat( stagingPath, function ( err, stats )
				{
					if ( err )
					{
						return done( err )
					}

					if ( stats.isDirectory() )
					{
						FS.readdir( stagingPath, function ( err, files )
							{
								if ( err )
								{
									return done( err )
								}

								// check for compressed file,
								// extract it,
								// combine with uncompressed files,
								// then compress them all

								if ( !files || files.length === 0 )
								{
									return done( false, false )
								}

								var dataPath = PATH.join( path, 'data' )

								// 100 files at a time - prevents crashes?
								var dataQueue = new Queue( 100 )

								var unlinkQueue = new Queue( 100 )

								var existingQueue = new Queue( 1 )

								var fileData = {}

								existingQueue.add( function ( next )
									{
										FS.readdir( dataPath, function ( err, files )
											{
												if ( err )
												{
													return done( err )
												}

												var innerQueue = new Queue( 100 )

												for ( var i = 0, l = files.length; i < l; ++i )
												{
													addToInnerQueue( innerQueue, fileData, PATH.join( dataPath, files[ i ] ), function ( err )
														{
															if ( err )
															{
																done( err )
															}
														}
													)
												}

												innerQueue.done( function ()
													{
														next()
													}
												)
											}
										)
									}
								)

								// set max listeners to avoid errors
								//gzip.setMaxListeners( files.length > 10 ? files.length : 10 )

								// set max listeners to avoid errors
								//out.setMaxListeners( files.length > 10 ? files.length : 10 )

								for ( var i = 0, l = files.length; i < l; ++i )
								{
									addToDataQueue( dataQueue, unlinkQueue, fileData, files[ i ], PATH.join( stagingPath, files[ i ] ), function ( err )
										{
											if ( err )
											{
												done( err )
											}
										}
									)
								}

								// finish up
								dataQueue.done( function ()
									{
										var gzPath = PATH.join( stagingPath, '../', 'tmp', 'archive.json.gz' )

										// final stream - writes to file
										var out = FS.createWriteStream( gzPath, { 'encoding': 'binary', 'mode': 0600 } )

										out.write( JSON.stringify( fileData ) )

										// queues within queues
										var finishQueue = new Queue()

										// add these listeners before piping gzip to out
										finishQueue.add( function ( next )
											{
												out.end( function ()
													{
														next()
													}
												)
											}
										)

										finishQueue.add( function ( next )
											{
												existingQueue.done( function ()
													{
														next()
													}
												)
											}
										)

										// wait for files to be unlinked
										// this works in the background while compression is happening
										finishQueue.add( function ( next )
											{
												unlinkQueue.done( function ()
													{
														next()
													}
												)
											}
										)

										finishQueue.done( function ()
											{
												fileData = null

												// finish this process
												done( false, true )
											}
										)
									}
								)
							}
						)
					}
				}
			)
		}

		function _decompress( data, done )
		{
			var gzPath = PATH.join( path, 'archive.json' ),

				gzPath = gzPath + '.gz'

			FS.exists( gzPath, function ( exists )
				{
					if ( !exists )
					{
						return done( 'db.decompress: archive does not exist' )
					}

					FS.readFile( gzPath, function ( err, contents )
						{
							if ( err )
							{
								return done( err )
							}

							var obj = JSON.parse( contents )

							var decompressQueue = new Queue( 100 )

							for ( var objKey in obj )
							{
								addToDecompressQueue( decompressQueue, PATH.join( path, objKey ), function ( err )
									{
										if ( err )
										{
											done( err )
										}
									}
								)
							}

							decompressQueue.done( function ()
								{
									// finished writing
									done()
								}
							)
						}
					)
				}
			)
		}

		PROCECUTOR
			.on( 'compress', _compress )

			.on( 'decompress', _decompress )
	}
)()
