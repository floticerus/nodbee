/** nodbee server socket class
 *  handles tcp connections
 *  2014 kevin von flotow
 */
( function ()
    {
        var PATH = require( 'path' )

        var ROOT_PATH = PATH.join( __dirname, '../', '../' )

        var P_JSON = require( PATH.join( ROOT_PATH, 'package.json' ) )

        var DB = require( PATH.join( ROOT_PATH, 'lib', 'db' ) )

        var NBCONFIG = JSON.parse( process.env.NBCONFIG )

        // Socket input handlers
        // switch between these on state change to avoid lookup on every input
        var nodbeeInput = {
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
            this.db = DB

            // run init method
            this.init()
        }

        // socket instance methods
        Socket.prototype = {
            // initialization method
            init: function ()
            {
                if ( !this.socket )
                {
                    return console.log( 'no socket?' )
                }

                // if remote access is disabled, test ip
                if ( NBCONFIG.remote_access !== true && this.socket.remoteAddress !== this.socket.localAddress )
                {
                    console.log( 'connection attempted in offline mode: ' + this.socket.remoteAddress + ':' + this.socket.remotePort )

                    // destroy the socket immediately
                    this.socket.destroy()

                    // return nothing
                    return
                }

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
                if ( !nodbeeInput.hasOwnProperty( state ) || this.state === state )
                {
                    return
                }

                this.state = state

                this.dataHandler = nodbeeInput[ state ].bind( this )
            },

            // first message sent to client
            printGreeting: function ()
            {
                this.socket.write(
                    'nodbee v' + P_JSON.version + '\r\n'

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
