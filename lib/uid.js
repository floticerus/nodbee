/** nodebee uid module
 *  2014 kevin von flotow
 */
( function ()
    {
        // generates an id that always starts with a lowercase letter
        // default is 16 characters
        function genUid( numChars )
        {
            var l = ( numChars || 16 ) - 1,

                s = ( ( Math.random() * 26 ) + 10 | 0 ).toString( 36 )

            for ( var i = 0; i < l; ++i )
            {
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
