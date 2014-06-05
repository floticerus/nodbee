/** nodebee server socket class
 *  handles tcp connections
 *  2014 kevin von flotow
 */
( function ()
    {
        var P_JSON = require( '../package.json' )

        var LIB = require( __dirname )

        var Collection = LIB.Collection

        // Socket input handlers
        // switch between these on state change to avoid lookup on every input
        var nodebeeInput = {
            'username': function ( data )
            {
                console.log( data )
            },

            'password': function ( data )
            {
                console.log( 'process password' )
            },

            'connected': function ( data )
            {
                console.log( 'process connected' )
            }
        }

        /** @constructor */
        function Socket( socket )
        {
            // save socket reference
            this.socket = socket

            // set default state to null - set to username later
            this.state = null

            // make db.js available to socket
            this.db = LIB.db

            // run init method
            this.init()
        }

        // socket instance methods
        Socket.prototype = {
            // initialization method
            init: function ()
            {
                // set default encoding to utf8
                this.socket.setEncoding( 'utf8' )

                // wrap listeners in anonymous function to make 
                // `this` available within functions as `that`
                ;( function ( that )
                    {
                        that.socket
                            .on( 'connect', function ()
                                {
                                    console.log( 'connect' )
                                }
                            )

                            // data received from client
                            .on( 'data', function ( data )
                                {
                                    that.dataHandler( data )
                                }
                            )

                            .on( 'end', function ()
                                {
                                    console.log( 'connection closed' )
                                }
                            )
                    }
                )( this )

                // print initial greeting/login screen

                this.printGreeting()
            },

            // empty placeholder method - overwrite this on state changes
            dataHandler: function (){},

            setState: function ( state )
            {
                if ( !nodebeeInput.hasOwnProperty( state ) || this.state === state )
                {
                    return
                }

                this.state = state

                this.dataHandler = nodebeeInput[ state ].bind( this )
            },

            // first message sent to client
            printGreeting: function ()
            {
                this.socket.write(
                    'nodebee v' + P_JSON.version + '\r\n'

                    // empty line
                    + '\r\n'

                    + 'username: '
                )
            },

            // username prompt
            printLogin: function ()
            {
                // set state to accept username input
                this.setState( 'username' )

                // write greeting message and login prompt
                this.socket.write( 'username: ' )
            },

            // password prompt
            printPassword: function ()
            {
                this.socket.write( 'password: ' )
            },

            // login failure message
            printLoginFail: function ()
            {
                this.socket.write(
                    'login failed. try again' + '\r\n'

                    + 'username: '
                )
            }
        }

        module.exports = Socket
    }
)()
