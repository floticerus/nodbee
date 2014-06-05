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

        var UID = new require( PATH.join( __dirname, '../', 'uid' ) )

        var ALGORITHM = 'aes-192-cbc'
        
        var EventEmitter = require( 'events' ).EventEmitter
        
        /** @constructor */
        function CryptProcess()
        {
            EventEmitter.call( this )
        }
        
        UTIL.inherits( CryptProcess, EventEmitter )

        CryptProcess.prototype.process = function ( fn, uid, pid, collectionName, data )
        {
            //this.tasks++

            data.uid = uid

            data.pid = pid

            data.fn = fn

            data.collection = collectionName

            process.send( data )
        }

        CryptProcess.prototype._listeners = {
            'encrypt': function ( uid, pid, collectionName, items )
            {
                // disable for now - encryption is cutting off the end of strings,
                // seems like it's not getting all of the data out of the buffer.
                //
                // also i cannot get the 'end' data event to trigger no matter what,
                // so the async mode isn't working properly and causing trouble

                return this.process( 'encrypt', uid, pid, collectionName,
                    {
                        items: items
                    }
                )

                var toSend = []

                items = items || []

                for ( var i = 0, l = items.length; i < l; ++i )
                {
                    var c = items[ i ],

                        keyBuf = new Buffer( c.key, 'hex' ),

                        cipher = CRYPTO.createCipher( ALGORITHM, keyBuf ),

                        buf = new Buffer( c.data, 'utf8' )

                    // console.log( c.data )

                    cipher.setEncoding( 'binary' )

                    cipher.write( buf, 'utf8' )

                    var encrypted = cipher.read()

                    // console.log( encrypted )

                    toSend.push(
                        {
                            key: c.key,

                            data: encrypted
                        }
                    )
                }

                // CryptProcess.prototype._listeners.decrypt.call( this, uid, pid, collectionName, toSend )

                //console.log( toSend )

                this.process( 'encrypt', uid, pid, collectionName,
                    {
                        items: toSend
                    }
                )
            },

            'decrypt': function ( uid, pid, collectionName, items )
            {
                // disable for now - encryption is cutting off the end of strings,
                // seems like it's not getting all of the data out of the buffer.
                //
                // also i cannot get the 'end' data event to trigger no matter what,
                // so the async mode isn't working properly and causing trouble

                return this.process( 'decrypt', uid, pid, collectionName,
                    {
                        items: items
                    }
                )

                var toSend = []

                items = items || []

                for ( var i = 0, l = items.length; i < l; ++i )
                {
                    var c = items[ i ],

                        keyBuf = new Buffer( c.key, 'hex' ),

                        decipher = CRYPTO.createDecipher( ALGORITHM, keyBuf ),

                        buf = new Buffer( c.data, 'binary' )

                    decipher.setEncoding( 'utf8' )

                    decipher.write( buf, 'binary' )

                    var decrypted = decipher.read()

                    toSend.push(
                        {
                            key: c.key,

                            data: decrypted
                        }
                    )
                }

                this.process( 'decrypt', uid, pid, collectionName,
                    {
                        items: toSend
                    }
                )
            }
        }
        
        var CRYPT_PROCESS = new CryptProcess()
        
        process.on( 'message', function ( message, handler )
            {
                // console.log( message )

                // make sure message is an object
                message = message || {}
                
                // break out if we shouldn't be here
                if ( !message.fn || !CRYPT_PROCESS._listeners[ message.fn ] )
                {
                    return
                }

                CRYPT_PROCESS._listeners[ message.fn ].apply( CRYPT_PROCESS, [ message.uid, message.pid, message.collection, message.items ] )
            }
        )
    }
)()
