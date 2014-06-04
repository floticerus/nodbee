( function ()
	{
		var util = require( 'util' )

		var EventEmitter = require( 'events' ).EventEmitter

		/** @constructor */
		function Nodebee() {}

		Nodebee.prototype = {

		}

		// inherit from EventEmitter
		util.inherits( Nodebee, EventEmitter )

		module.exports = new Nodebee()
	}
)()
