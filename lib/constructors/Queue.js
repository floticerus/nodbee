/** nodebee queue class
 *  2014 kevin von flotow
 *
 *  executes functions passed to the instance.
 *  if maxProcesses is exceeded, it will wait for
 *  running processes to finish before executing
 *
 *  basically, this limits the number of async
 *  functions that are running at any given time
 */
( function ()
    {
        var UTIL = require( 'util' )

        var EventEmitter = require( 'events' ).EventEmitter

        function nextQueue()
        {
            this.processes--

            this.emit( 'next' )
        }

        function processQueue()
        {
            // return if queue is empty
            if ( this.queue.length === 0 )
            {
                return
            }

            if ( this.processes <= this.maxProcesses )
            {
                this.processes++

                // shift and execute, pass nextQueue
                this.queue.shift()( nextQueue.bind( this ) )
            }
        }

        /** @constructor */
        function Queue( maxProcesses )
        {
            // max simultaneous processes, if this is exceeded they will be queued
            // default is currently 50
            this.maxProcesses = typeof maxProcesses !== 'undefined' ? maxProcesses : 50

            this.processes = 0

            this.queue = []

            // bind processQueue to next event
            this.on( 'next', processQueue.bind( this ) )
        }

        UTIL.inherits( Queue, EventEmitter )

        Queue.prototype.add = function ( fn )
        {
            this.queue.push( fn )

            this.emit( 'next' )
        }

        module.exports = Queue
    }
)()