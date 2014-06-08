/** nodebee cryptography module
 *  2014 kevin von flotow
 */
( function ()
    {
        var UTIL = require( 'util' )

        var PATH = require( 'path' )

        var CRYPTO = require( 'crypto' )

        var CHILD_PROCESS = require( 'child_process' )

        var Uid = require( PATH.join( __dirname, '../', 'constructors', 'Uid' ) )

        var UID = new Uid()

        var NBCONFIG = JSON.parse( process.env.NBCONFIG )

        var FILES = require( PATH.join( __dirname, '../', 'files' ) )

        // make reference to path so it doesn't run every time
        var CHILD_PATH = PATH.join( __dirname, 'child.js' )

        // EventEmitter class
        //var EventEmitter = require( 'events' ).EventEmitter

        // keep track of calls waiting for a response from a child process
        var PROCESSING = {}

        var ENCRYPT_CALLBACKS = {}

        var SALT_LENGTH = 128

        /** @constructor */
        function Crypts()
        {
            //EventEmitter.call( this )
        }
        
        //UTIL.inherits( Crypts, EventEmitter )
        
        // message listeners for this instance
        Crypts.prototype._listeners = {
            'encrypt': function ( uid, collectionName, key, data )
            {
                ( function ( that )
                    {
                        that.processed( uid, function ()
                            {
                                if ( ENCRYPT_CALLBACKS[ uid ] )
                                {
                                    ENCRYPT_CALLBACKS[ uid ](
                                        {
                                            key: key,

                                            data: data
                                        }
                                    )

                                    ENCRYPT_CALLBACKS[ uid ] = undefined

                                    delete ENCRYPT_CALLBACKS[ uid ]
                                }
                            }
                        )
                    }
                )( this )
            },

            'decrypt': function ( uid, collectionName, items )
            {
                ( function ( that, obj )
                    {
                        that.processed( uid, function ()
                            {
                                // that.emit( 'decrypt', items )
                            }
                        )
                    }
                )( this )
            }
        }

        Crypts.prototype.add = function ( callback )
        {
            if ( !NBCONFIG.file_encryption_algorithm )
            {
                return callback( false )
            }

            var child = CHILD_PROCESS.fork( CHILD_PATH )

            ;( function ( that )
                {
                    child
                        .on( 'message', function ( message, handle )
                            {
                                // make sure message is an object
                                message = message || {}
                                    
                                // break out if we shouldn't be here
                                if ( !message.fn || !that._listeners[ message.fn ] )
                                {
                                    return
                                }

                                // console.log( message )

                                that._listeners[ message.fn ].apply( that, [ message.uid, message.collection, message.key, message.data ] )
                            }
                        )

                        .on( 'close', function ( code, signal )
                            {
                                if ( signal )
                                {
                                    console.log( 'crypt process was killed by signal: ' + signal )
                                        
                                    // should we fork a new process here?
                                }
                                else if ( code !== 0 )
                                {
                                    console.log( 'crypt process exited with error code: ' + code )
                                }
                                else
                                {
                                    // console.log( 'crypt process exited normally' )
                                }
                            }
                        )

                    if ( callback )
                    {
                        callback( child )
                    }
                }
            )( this )

            return this
        }

        Crypts.prototype.encrypt = function ( collectionName, data, callback )
        {
            if ( !NBCONFIG.file_encryption_algorithm )
            {
                return callback( data )
            }

            return this.process( 'encrypt', collectionName, data, callback )
        }

        Crypts.prototype.decrypt = function ( collectionName, data, callback )
        {
            if ( !NBCONFIG.file_encryption_algorithm )
            {
                return callback( data )
            }

            return this.process( 'decrypt', collectionName, data, callback )
        }

        Crypts.prototype.makeHash = function ( str )
        {
            return CRYPTO.createHash( NBCONFIG.digest_algorithm ).update( str.toString() + process.env.NBKEY ).digest( 'hex' )
        }

        Crypts.prototype.testHash = function ( str, hashed )
        {
            return this.makeHash( str ) === hashed
        }

        Crypts.prototype.process = function ( fn, collectionName, data, callback )
        {
            ( function ( that )
                {
                    that.add( function ( child )
                        {
                            if ( !child )
                            {
                                return console.log( 'crypt error: best process not found?' )
                            }

                            var uid = UID.add(),

                                // need to add pepper with salt
                                key = that.makeHash( uid ),

                                toSend = {}

                            toSend = {
                                uid: uid,

                                fn: 'encrypt',

                                collection: collectionName,

                                key: key,

                                data: data
                            }

                            if ( callback )
                            {
                                ENCRYPT_CALLBACKS[ uid ] = callback
                            }

                            PROCESSING[ uid ] = toSend

                            child.send( toSend )
                        }
                    )
                }
            )( this )

            return this
        }

        Crypts.prototype.processed = function ( uid, callback )
        {
            // make sure the id is waiting to be processed
            if ( !PROCESSING[ uid ] )
            {
                return
            }

            if ( callback )
            {
                callback()
            }

            PROCESSING[ uid ] = null

            delete PROCESSING[ uid ]
        }

        module.exports = new Crypts()
    }
)()
