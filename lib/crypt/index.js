/** nodbee cryptography module
 *  2014 kevin von flotow
 */
( function ()
    {
        var UTIL = require( 'util' )

        var PATH = require( 'path' )

        var CRYPTO = require( 'crypto' )

        var CHILD_PROCESS = require( 'child_process' )

        var NBCONFIG = JSON.parse( process.env.NBCONFIG )

        var Uid = require( PATH.join( __dirname, '../', 'constructors', 'Uid' ) )

        // make reference to path so it doesn't run every time
        var CHILD_PATH = PATH.join( __dirname, 'child.js' )

        var Procecutor = require( PATH.join( __dirname, '../', 'constructors', 'Procecutor' ) )

        var PROCECUTOR = new Procecutor(
            {
                path: PATH.join( __dirname, 'child.js' ),

                min: 1,

                max: 8,

                sleep: 60 * 2, // 2 minutes

                timeout: 60, // 1 minute

                // kills the process on response
                suicide: true
            }
        )

        /** @constructor */
        function Crypts()
        {
            
        }

        Crypts.prototype.encrypt = function ( uid, data, callback )
        {
            if ( !NBCONFIG.file_encryption_algorithm )
            {
                return callback(
                    {
                        key: uid,

                        data: data
                    }
                )
            }

            this.process( 'encrypt', uid, data, callback )
        }

        Crypts.prototype.encryptFile = function ( path, callback )
        {
            if ( !NBCONFIG.file_encryption_algorithm )
            {
                return callback()
            }

            this.process( 'encryptFile', Uid.gen( 16, true ), path, callback )
        }

        Crypts.prototype.decryptFile = function ( path, out, callback )
        {
            var uid = PATH.basename( path )

            var toSend = {
                uid: uid,

                path: path,

                out: out
            }

            PROCECUTOR.exec( 'decryptFile', toSend, function ( err, result )
                {
                    if ( err )
                    {
                        console.log( err )
                    }

                    callback( result, uid )
                }
            )

            // this.process( 'decryptFile', PATH.basename( path ), path, callback )
        }

        Crypts.prototype.decryptFileToObject = function ( path, callback )
        {
            var uid = PATH.basename( path )

            var toSend = {
                uid: uid,

                path: path
            }

            PROCECUTOR.exec( 'decryptFileToObject', toSend, function ( err, result )
                {
                    if ( result )
                    {
                        result = JSON.parse( result )
                    }

                    callback( err, result )
                }
            )
        }

        Crypts.prototype.decrypt = function ( uid, data, callback )
        {
            if ( !NBCONFIG.file_encryption_algorithm )
            {
                return callback(
                    {
                        key: uid,

                        data: data
                    }
                )
            }

            this.process( 'decrypt', uid, data, callback )
        }

        /* Crypts.prototype.makeHash = function ( str )
        {
            return CRYPTO.createHash( NBCONFIG.hash_algorithm ).update( str.toString() + process.env.NBKEY ).digest( 'hex' )
        }

        Crypts.prototype.testHash = function ( str, hashed )
        {
            return this.makeHash( str ) === hashed
        } */

        Crypts.prototype.process = function ( fn, uid, data, callback )
        {
            //var key = this.makeHash( uid )

            var toSend = {
                uid: uid,

                // key: key,

                data: data
            }

            PROCECUTOR.exec( fn, toSend, function ( err, result )
                {
                    if ( err )
                    {
                        console.log( err )
                    }

                    callback( result, uid )
                }
            )
        }

        module.exports = new Crypts()
    }
)()
