/** nodebee Procecutor constructor
 *  2014 kevin von flotow
 *
 *  environmentally friendly child process pooling
 */
 ( function ()
    {
        var UTIL = require( 'util' )

        var PATH = require( 'path' )

        var FORK = require( 'child_process' ).fork

        var MESSAGES = require( PATH.join( __dirname, '../', 'messages' ) )

        var EventEmitter = require( 'events' ).EventEmitter

        var Queue = require( PATH.join( __dirname, 'Queue' ) )

        // private methods for Procecutor

        // trigger activity - update lastActive for the instance
        function _activity()
        {
            this.lastActive = Date.now()
        }

        // add process to instance
        function _add( num )
        {
            if ( !num )
            {
                return // something
            }

            // make sure the limit hasn't been reached
            if ( this.length >= this.opts.max )
            {
                return // something
            }

            // create and push if we're just adding one
            if ( num === 1 )
            {
                return _addChild.call( this, _createChild.call( this ) )
            }

            // to help prevent crashes,
            // only allow a few async functions to execute at a time
            // this does not affect the total number of processes that will load
            var queue = new Queue( 10 )

            var that = this

            while ( num-- > 0 )
            {
                queue.add( function ( next )
                    {
                        next( null, _createChild.call( that ) )
                    }
                )
            }

            queue.done( function ( err, children )
                {
                    for ( var i = 0, l = children.length; i < l; ++i )
                    {
                        _addChild.call( this, children[ i ] )
                    }
                }
            )
        }

        function _addChild( child )
        {
            // reference child in this instance
            this.processes[ child.pid ] = child

            // check if best process in the instance should be replaced
            _checkBest.call( this, child.child.pid )
        }

        function _checkBest( pid )
        {
            if ( !this.processes[ this.best ] || ( this.processes[ pid ] && this.processes[ pid ].count < this.processes[ this.best ].count ) )
            {
                this.best = pid
            }
        }

        function _createChild()
        {
            var child = FORK( this.opts.path, this.opts.args, this.opts.opts )

            // add event handlers to the child and return

            return {
                child: child,

                // number of functions currently being executed within the child process
                count: 0
            }
        }

        // remove process from instance
        function _remove()
        {

        }

        /** @constructor */
        function Procecutor( opts )
        {
            // call EventEmitter constructor as this
            EventEmitter.call( this )

            // number of active processes
            this.length = 0

            // index of the process that currently has the least activity
            // right now this is just the child with the fewest functions executing
            this.best = 0

            // set initial lastActive time as now
            _activity.call( this )

            // make sure opts is an object
            this.opts = opts || {}

            // return if path isn't set
            if ( !this.opts.path )
            {
                return // something
            }

            // minimum number of wanted processes
            this.opts.min = typeof this.opts.min !== 'undefined' ? this.opts.min : 2

            // maximum number of processes
            this.opts.max = typeof this.opts.max !== 'undefined' ? this.opts.max : 10

            // slow down to a single process after this amount of idle time
            // fire back up as needed - try to keep 1 empty process if possible
            // for example, if a new process is needed, create 2
            // go green, save the planet, etc
            this.opts.sleep = typeof this.opts.sleep !== 'undefined' ? this.opts.sleep : 300 * 1000 // 5 minutes

            // end an individual process if it has been idle for this amount of time
            this.opts.timeout = typeof this.opts.timeout !== 'undefined' ? this.opts.timeout : 60 * 1000 // 1 minute

            // args to pass to the child process
            this.opts.args = this.opts.args || null

            // options to pass to the child process
            this.opts.opts = this.opts.opts || null

            // keep track of processes
            this.processes = {}

            // use get accessor for idleTime
            Object.defineProperty( this, 'idleTime',
                {
                    get: function ()
                    {
                        return Date.now() - this.lastActive
                    }
                }
            )

            // start the minimum number of wanted processes
            _add.call( this, this.opts.min )
        }

        // inherit from EventEmitter constructor
        UTIL.inherits( Procecutor, EventEmitter )

        // pass constructor
        module.exports = Procecutor
    }
)()
