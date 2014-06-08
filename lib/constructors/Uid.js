/** nodebee uid module
 *  2014 kevin von flotow
 */
( function ()
    {
        /* var otherChars = [ '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+', '<', '>', '?', ':' ],

            otherLength = otherChars.length */

        // generates an id that always starts with a lowercase letter
        // default is 16 characters
        function genUid( numChars, lowercaseOnly )
        {
            var l = ( numChars || 16 ) - 1,

                s = ( ( Math.random() * 26 ) + 10 | 0 ).toString( 36 ),

                i = 0

            if ( lowercaseOnly )
            {
                for ( ; i < l; ++i )
                {
                    s += ( Math.random() * 36 | 0 ).toString( 36 )
                }
            }
            else
            {
                for ( ; i < l; ++i )
                {
                    /* var n, c

                    if ( specialChars )
                    {
                        var n = Math.random() * ( 36 + otherLength ) | 0,

                            c = n < 36 ? n.toString( 36 ) : otherChars[ n - 36 ]
                    }
                    else
                    {
                        var n = Math.random() * 36 | 0,

                            c = n.toString( 36 )
                    } */

                    var n = Math.random() * 36 | 0,

                        c = n.toString( 36 )

                    if ( !lowercaseOnly && n > 9 && ( Math.random() + 0.3 | 0 ) === 1 )
                    {
                        c = c.toUpperCase()
                    }

                    s += c
                }
            }

            return s
        }

        /** @constructor */
        function Uid( opts )
        {
            opts = opts || {}

            opts.lowercase = typeof opts.lowercase !== 'undefined' ? opts.lowercase : false

            this.opts = opts

            this.uids = {}
        }

        Uid.gen = function ( numChars, lowercaseOnly )
        {
            return genUid( numChars, lowercaseOnly )
        }

        // generates an id unique to this instance
        Uid.prototype.add = function ( numChars )
        {
            numChars = numChars || 0

            var ret = genUid( numChars, this.opts.lowercase )

            while ( this.uids[ ret ] )
            {
                ret = genUid( numChars, this.opts.lowercase )
            }

            this.uids[ ret ] = ret

            return ret
        }

        // imports the uid into the list of uids for this instance
        // to ensure that .add() returns a unique result
        Uid.prototype.import = function ( uid )
        {
            this.uids[ uid ] = uid
        }

        module.exports = Uid
    }
)()
