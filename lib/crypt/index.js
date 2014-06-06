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

        var FILES = require( PATH.join( __dirname, '../', 'files' ) )

        // make reference to path so it doesn't run every time
        var CHILD_PATH = PATH.join( __dirname, 'child.js' )

        // EventEmitter class
        var EventEmitter = require( 'events' ).EventEmitter

        // keep track of calls waiting for a response from a child process
        var PROCESSING = {}

        // number of processes to autorun
        //
        // will need to make this more easily adjustable later
        // adjusting this on more powerful computers might
        // boost performance when accessing multiple files
        var PROCESSES = 2

        var SALT_LENGTH = 128

        /** @constructor */
        function Crypts( amount )
        {
            EventEmitter.call( this )
        
            // keep track of how many crypt threads are running
            this.length = 0

            // keep track of how many tasks are within each process
            this.tasks = {}

            // see if we should autorun some children threads
            if ( typeof amount !== 'undefined' )
            {
                this.add( amount )
            }
        }
        
        UTIL.inherits( Crypts, EventEmitter )
        
        // message listeners for this instance
        Crypts.prototype._listeners = {
            'encrypt': function ( uid, pid, collectionName, items )
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
                        fn: 'encrypt',

                        uid: uid,

                        pid: pid,

                        collection: collectionName,

                        items: items
                    }
                )
            },

            'decrypt': function ( uid, pid, collectionName, items )
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
                        fn: 'decrypt',

                        id: uid,

                        pid: pid,

                        collection: collectionName,

                        items: items
                    }
                )
            }
        }

        Crypts.prototype.add = function ( amount )
        {
            // see if we should loop or add a child thread
            if ( typeof amount !== 'undefined' )
            {
                // loop and spawn the appropriate amount of children threads
                for ( var i = 0; i < amount; ++i )
                {
                    this.add()
                }
            }
            else
            {   
                // no amount given, fork child thread
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

                                    that._listeners[ message.fn ].apply( that, [ message.uid, message.pid, message.collection, message.items ] )
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
                                        
                                        // crash, add new process
                                        that.add()
                                    }
                                    else
                                    {
                                        console.log( 'crypt process exited normally' )
                                    }
                                }
                            )
                    }
                )( this )

                this.tasks[ child.pid ] = 0

                // reference child in this instance and increase length
                this[ this.length++ ] = child
            }

            return this
        }

        // find the best crypt process to use
        Crypts.prototype.best = function ( callback )
        {
            var best = null,

                lowest = Infinity

            // loop through all processes
            for ( var i = 0, l = this.length; i < l; ++i )
            {
                var c = this.tasks[ this[ i ].pid ]

                // if the process has 0 tasks, set as best and break loop
                if ( c === 0 )
                {
                    best = this[ i ]

                    break
                }

                // process is performing tasks, compare

                // continue loop unless this task is performing the fewest tasks
                if ( c >= lowest )
                {
                    continue
                }
                
                // ding ding ding
                // we have a winner
                lowest = c

                best = this[ i ]
            }

            // see if callback function is set
            if ( callback )
            {
                // pass best process to callback function
                callback( best )

                // return this to remain chainable
                return this
            }

            // callback not set, return best process
            return best
        }

        Crypts.prototype.encrypt = function ( collectionName, data )
        {
            return this.process( 'encrypt', collectionName, data )
        }

        Crypts.prototype.decrypt = function ( collectionName, data )
        {
            return this.process( 'decrypt', collectionName, data )
        }

        Crypts.prototype.process = function ( fn, collectionName, data )
        {
            ( function ( that )
                {
                    that.best( function ( child )
                        {
                            if ( !child )
                            {
                                return console.log( 'crypt error: best process not found?' )
                            }

                            that.tasks[ child.pid ]++

                            var uid = UID.add(),

                                key = CRYPTO.createHash( 'rmd160' ).update( fn + uid ).digest( 'hex' ),

                                toSend = {}

                            toSend = {
                                uid: uid,

                                pid: child.pid,

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

            // make sure tasks is never below 0
            if ( this.tasks[ PROCESSING[ uid ].pid ] > 0 )
            {
                this.tasks[ PROCESSING[ uid ].pid ]--
            }

            PROCESSING[ uid ] = null

            delete PROCESSING[ uid ]
        }

        Crypts.prototype.remove = function ( pid )
        {
            for ( var i = 0, l = this.length; i < l; ++i )
            {
                if ( this[ i ].pid === pid )
                {
                        
                        
                    break
                }
            }
        }
        
        Crypts.prototype.removeAll = function ()
        {
            for ( var i = 0, l = this.length; i < l; ++i )
            {
                // this.remove( this[ i ].pid )
            }
        }

        Crypts.prototype.sendAll = function ( fn, key, data )
        {
            for ( var i = 0, l = this.length; i < l; ++i )
            {
                this[ i ].send(
                    {
                        'fn': fn,

                        'uid': UID.add(),

                        'pid': this[ i ].pid,

                        'key': key,

                        'data': data
                    }
                )
            }
        }

        var crypts = new Crypts( PROCESSES )

        crypts
            .on( 'encrypt', function ( data )
                {
                    console.log( data )
                }
            )

            .on( 'decrypt', function ( data )
                {
                    console.log( data )
                }
            )

        crypts.encrypt( 'test', 'On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains test..' )
        
        crypts.encrypt( 'test', 'testing 1 2 3 heyyyy!! hmmm, yeah i am trying to make this a little longer. let us see how it goes.' )

        var obj = { 'test': 'hmmmm' }

        //console.log( JSON.parse( { test: 'json' }.toString() ) )

        //crypts.encrypt( 'test', JSON.stringify( obj ) )

        module.exports = crypts
    }
)()
