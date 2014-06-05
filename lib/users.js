/** nodebee users module
 *  2014 kevin von flotow
 */
( function ()
    {
        var PATH = require( 'path' )

        var LIB = require( __dirname )

        // load crypt module for .bee files
        var CRYPT = LIB.crypt

        var authenticated = false

        /** @constructor */
        function Users()
        {
            
        }

        Users.prototype.add = function ( username, password )
        {

        }

        Users.prototype.isAuthenticated = function ()
        {
            // check if already authenticated
            if ( authenticated )
            {
                return authenticated
            }


        }

        Users.prototype.login = function ( username, password )
        {

        }

        Users.prototype.logout = function ()
        {

        }

        Users.prototype.changePassword = function ( username, newPassword )
        {

        }

        Users.prototype.remove = function ( username )
        {
            // make sure the user has admin privileges
        }

        module.exports = new Users()
    }
)()
