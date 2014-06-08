/** nodebee parallel class
 *  2014 kevin von flotow
 *
 * executes functions in parallel
 * inspired by node-parallel
 * written to have no dependencies
 */
( function ()
    {
        function doDone()
        {
            if ( this.doneFn && this.length === this.finished )
            {
                this.doneFn( this.err.length !== 0 ? this.err : null, this.results )
            }
        }

        // done function to pass to .add()
        function finish( err, result )
        {
            err && this.err.push( err )

            typeof result !== 'undefined' && this.results.push( result )

            this.finished++

            doDone.call( this )
        }

        /** @constructor */
        function Parallel()
        {
            // number of functions that are loaded into this instance
            this.length = 0

            this.finished = 0

            this.err = []

            this.results = []

            this.doneFn = null
        }

        // don't check type, just assume all is well
        // looking for performance, not user-friendlyness
        Parallel.prototype.add = function ( fn )
        {
            this.length++

            // execute function, pass finish function bound to this instance
            fn( finish.bind( this ) )

            // return this to be chainable
            return this
        }

        Parallel.prototype.done = function ( fn )
        {
            this.doneFn = fn

            doDone.call( this )
        }

        // export the constructor
        module.exports = Parallel
    }
)()
