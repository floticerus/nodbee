/** nodebee worker compression module
 *  2014 kevin von flotow
 *
 *  should spawn a child process that deals with compression
 *  2 line indentation for this file because the nesting is insane
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

    var FS = require( 'fs' )

    var PATH = require( 'path' )

    var ZLIB = require( 'zlib' )

    var STREAM = require( 'stream' )

    var FILES = require( PATH.join( __dirname, '../', 'files' ) )

    var MESSAGES = require( PATH.join( __dirname, '../', 'messages' ) )

    var CRYPT = require( PATH.join( __dirname, '../', 'crypt' ) )

    var Queue = require( PATH.join( __dirname, '../', 'constructors', 'Queue' ) )

    /** @constructor */
    function Compression()
    {

    }

    // holy nesting, batman
    Compression.prototype.compress = function ( path, callback )
    {
      callback = callback || function(){}

      FS.exists( path, function ( exists )
        {
          if ( !exists )
          {
            return callback( 'db.compress: path does not exist' )
          }

          FS.stat( path, function ( err, stats )
            {
              if ( err )
              {
                return callback( err )
              }

              if ( stats.isDirectory() )
              {
                FS.readdir( path, function ( err, files )
                  {
                    if ( err )
                    {
                      return callback( err )
                    }

                    // check for compressed file,
                    // extract it,
                    // combine with uncompressed files,
                    // then compress them all

                    var data = {},

                      // 100 files at a time - prevents crashes?
                      dataQueue = new Queue( 100 ),

                      jsonPath = PATH.join( path, '../', 'tmp', 'archive.json' ),

                      gzPath = jsonPath + '.gz'

                    for ( var i = 0, l = files.length; i < l; ++i )
                    {
                      ( function ( file )
                        {
                          dataQueue.add( function ( next )
                            {
                              var filePath = PATH.join( path, file )

                              FS.readFile( filePath, { 'encoding': 'binary' }, function ( err, contents )
                                {
                                  data[ file ] = contents.trim()

                                  next()
                                }
                              )
                            }
                          )
                        }
                      )( files[ i ] )
                    }

                    dataQueue.done( function ()
                      {
                        console.log( 'done reading json' )

                        // write uncompressed .json file
                        FILES.writeBinary( jsonPath, JSON.stringify( data ), function ( err )
                          {
                            if ( err )
                            {
                              return callback( err )
                            }

                            var gzip = ZLIB.createGzip()

                            var inp = FS.createReadStream( jsonPath )

                            var out = FS.createWriteStream( gzPath, { 'encoding': 'binary', 'mode': 0600 } )

                            // inp.pipe( out )

                            inp.pipe( gzip ).pipe( out )

                            // might want to change this to finish event
                            out.on( 'close', function ()
                              {
                                var unlinkQueue = new Queue( 100 )

                                // wait until archive is finished writing,
                                // then remove individual files using
                                // keys from data object
                                for ( var key in data )
                                {
                                  ( function ( keyPath )
                                    {
                                      unlinkQueue.add( function ( nextUnlink )
                                        {
                                          FS.exists( keyPath, function ( exists )
                                            {
                                              if ( !exists )
                                              {
                                                nextUnlink()

                                                return callback( 'db compress: problem unlinking database file: ' + keyPath, false )
                                              }

                                              FS.unlink( keyPath, function ( err )
                                                {
                                                  nextUnlink()

                                                  if ( err )
                                                  {
                                                    return callback( err )
                                                  }
                                                }
                                              )
                                            }
                                          )
                                        }
                                      )
                                    }
                                  )( PATH.join( path, key.toString() ) )
                                }

                                unlinkQueue.done( function ()
                                  {
                                    FS.exists( jsonPath, function ( exists )
                                      {
                                        if ( !exists )
                                        {
                                          return callback( 'db compress: could not find ' + jsonPath )
                                        }

                                        FS.unlink( jsonPath, function ( err )
                                          {
                                            if ( err )
                                            {
                                              return callback ( err )
                                            }

                                            // CRYPT.encrypt( process.env.NBKEY,  )

                                            return callback( err, gzPath )
                                          }
                                        )
                                      }
                                    )
                                  }
                                )
                              }
                            )
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
      )
    }
    // ^^^ just look at those brackets

    Compression.prototype.decompress = function ( path, callback )
    {
      callback = callback || function(){}

      var jsonPath = PATH.join( path, 'archive.json' ),

        gzPath = jsonPath + '.gz'

      FS.exists( gzPath, function ( exists )
        {
          if ( !exists )
          {
            return callback( 'db.decompress: archive does not exist' )
          }

          var gunzip = ZLIB.createGunzip()

          var inp = FS.createReadStream( gzPath )

          var out = FS.createWriteStream( jsonPath,
            {
              'encoding': 'binary',

              'mode': 0600
            }
          )

          inp.pipe( gunzip ).pipe( out )

          out.on( 'close', function ()
            {
              // gunzip complete
              FS.exists( jsonPath, function ( exists )
                {
                  if ( !exists )
                  {
                    return callback( 'db decompress: archive.json not found' )
                  }

                  FS.readFile( jsonPath, function ( err, contents )
                    {
                      if ( err )
                      {
                        return callback( err )
                      }

                      var obj = JSON.parse( contents )

                      var decompressQueue = new Queue( 100 )

                      for ( var objKey in obj )
                      {
                        ( function ( key, val )
                          {
                            decompressQueue.add( function ( next )
                              {
                                FILES.writeBinary( PATH.join( path, key ), val, function ( err )
                                  {
                                    next()
                                  }
                                )
                              }
                            )
                          }
                        )( objKey, obj[ objKey ] )
                      }

                      decompressQueue.done( function ()
                        {
                          // finished writing
                          callback()
                        }
                      )
                    }
                  )
                }
              )
            }
          )
        }
      )
    }

    var compression = new Compression()

    MESSAGES
      .on( 'compress', function ( data )
        {
          compression.compress( data.path, function ( err )
            {
              console.log( err )

              MESSAGES.sendToWorker( CLUSTER.workers[ data.worker ], 'compression_compress' + data.uid )
            }
          )
        }
      )

      .on( 'decompress', function ()
        {

        }
      )

    module.exports = compression
  }
)()
