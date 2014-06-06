/** nodebee uid module
 *  2014 kevin von flotow
 */
( function ()
    {
        /* var otherChars = [ '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+', '<', '>', '?', ':' ],

            otherLength = otherChars.length */

        // generates an id that always starts with a lowercase letter
        // default is 16 characters
        function genUid( numChars )
        {
            var l = ( numChars || 16 ) - 1,

                s = ( ( Math.random() * 26 ) + 10 | 0 ).toString( 36 )

            for ( var i = 0; i < l; ++i )
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

                if ( n > 9 && ( Math.random() + 0.3 | 0 ) === 1 )
                {
                    c = c.toUpperCase()
                }

                s += c
            }

            return s
        }

        /** @constructor */
        function Uid()
        {
            this.uids = {}
        }

        Uid.gen = function ( numChars )
        {
            return genUid( numChars )
        }

        Uid.prototype.add = function ( numChars )
        {
            numChars = numChars || 0

            var ret = genUid( numChars )

            while ( this.uids.hasOwnProperty( ret ) )
            {
                ret = genUid( numChars )
            }

            return ret
        }

        module.exports = Uid
    }
)()
