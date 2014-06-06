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
            if ( !this.isDone && this.length === this.finished )
            {
                this.isDone = true

                if ( this.doneFn )
                {
                    this.doneFn( this.err.length > 0 ? this.err : null, this.results )
                }
            }
        }

        function finish( err, result )
        {
            if ( err )
            {
                this.err.push( err )
            }

            if ( result )
            {
                this.results.push( result )
            }

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

            this.isDone = false
        }

        Parallel.prototype.add = function ( fn )
        {
            this.length++

            fn( finish.bind( this ) )
        }

        Parallel.prototype.done = function ( fn )
        {
            this.doneFn = fn

            doDone.call( this )
        }

        module.exports = Parallel
    }
)()
