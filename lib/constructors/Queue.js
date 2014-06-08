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
        function nextQueue()
        {
            this.processes--

            processQueue.call( this )
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

            // begin processes at 1
            this.processes = 1

            this.queue = []
        }

        Queue.prototype.add = function ( fn )
        {
            this.queue.push( fn )

            processQueue.call( this )
        }

        module.exports = Queue
    }
)()
