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

        var NBCONFIG = process.env.NBCONFIG ? JSON.parse( process.env.NBCONFIG ) : {}

        var FILES = require( PATH.join( __dirname, '../', 'files' ) )

        // make reference to path so it doesn't run every time
        var CHILD_PATH = PATH.join( __dirname, 'child.js' )

        // EventEmitter class
        var EventEmitter = require( 'events' ).EventEmitter

        // keep track of calls waiting for a response from a child process
        var PROCESSING = {}

        var ENCRYPT_CALLBACKS = {}

        var SALT_LENGTH = 128

        /** @constructor */
        function Crypts()
        {
            EventEmitter.call( this )

            this
                .on( 'encrypt', function ( data )
                    {
                        //console.log( data )

                        if ( ENCRYPT_CALLBACKS[ data.uid ] )
                        {
                            ENCRYPT_CALLBACKS[ data.uid ]( data )

                            ENCRYPT_CALLBACKS[ data.uid ] = undefined

                            delete ENCRYPT_CALLBACKS[ data.uid ]
                        }
                    }
                )

                .on( 'decrypt', function ( data )
                    {
                        //console.log( data )
                    }
                )
        }
        
        UTIL.inherits( Crypts, EventEmitter )
        
        // message listeners for this instance
        Crypts.prototype._listeners = {
            'encrypt': function ( uid, collectionName, items )
            {
                ( function ( that, obj )
                    {
                        that.processed( uid, obj, function ()
                            {
                                // trigger final event containing encrypted items
                                // intercept with file handler and write to file
                                that.emit( 'encrypt', obj )
                            }
                        )
                    }
                )( this,
                    {
                        uid: uid,

                        collection: collectionName,

                        items: items
                    }
                )
            },

            'decrypt': function ( uid, collectionName, items )
            {
                ( function ( that, obj )
                    {
                        that.processed( uid, obj, function ()
                            {
                                // i don't think we need fn for decrypts?
                                if ( obj.fn )
                                {
                                    delete obj.fn
                                }

                                that.emit( 'decrypt', items )
                            }
                        )
                    }
                )( this,
                    {
                        uid: uid,

                        collection: collectionName,

                        items: items
                    }
                )
            }
        }

        Crypts.prototype.add = function ( callback )
        {
            if ( !NBCONFIG.file_encryption )
            {
                return
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

                                that._listeners[ message.fn ].apply( that, [ message.uid, message.collection, message.items ] )
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
            if ( !NBCONFIG.file_encryption )
            {
                return data
            }

            return this.process( 'encrypt', collectionName, data, callback )
        }

        Crypts.prototype.decrypt = function ( collectionName, data, callback )
        {
            if ( !NBCONFIG.file_encryption )
            {
                return data
            }

            return this.process( 'decrypt', collectionName, data, callback )
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

                                key = CRYPTO.createHash( 'rmd160' ).update( fn + uid ).digest( 'hex' ),

                                toSend = {}

                            toSend = {
                                uid: uid,

                                fn: 'encrypt',

                                collection: collectionName,

                                items:
                                [
                                    {
                                        key: key,

                                        data: data
                                    }
                                ]
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

        Crypts.prototype.processed = function ( uid, data, callback )
        {
            //console.log( data )

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

        // var crypts = new Crypts()

        //crypts.encrypt( 'test', 'testing 1 2 3 heyyyy!! hmmm, yeah i am trying to make this a little longer. let us see how it goes.' )

        module.exports = new Crypts()
    }
)()
