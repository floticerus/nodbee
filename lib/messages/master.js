/** nodebee messages master module
 *  2014 kevin von flotow
 *
 *  communication with worker nodes
 */
( function ()
    {
        var CLUSTER = require( 'cluster' )

        var UTIL = require( 'util' )

        var EventEmitter = require( 'events' ).EventEmitter

        /** @constructor */
        function Messages()
        {
            EventEmitter.call( this )

            this.init()
        }

        UTIL.inherits( Messages, EventEmitter )

        Messages.prototype.init = function ()
        {
            
        }

        Messages.prototype.sendToWorker = function ( worker, name, obj )
        {
            worker.send(
                {
                    name: name,

                    data: obj
                }
            )
        }

        var messages = new Messages()

        CLUSTER.on( 'online', function ( worker, address )
            {
                worker.on( 'message', function ( message )
                    {
                        if ( !message.name )
                        {
                            return
                        }

                        messages.emit( message.name, JSON.parse( message.data ) )
                    }
                )

                messages.sendToWorker( worker, 'connected' )
            }
        )

        module.exports = messages
    }
)()
