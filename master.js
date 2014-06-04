( function ()
	{
		var CLUSTER = require( 'cluster' )
		
		if ( !CLUSTER.isMaster )
		{
			return
		}
		
		var OS = require( 'os' )
		
		var NUM_CPUS = OS.cpus().length || 1
		
		for ( var i = 0; i < NUM_CPUS; ++i )
		{
			var worker = CLUSTER.fork()
			
			worker
				.on( 'listening', function ( address )
					{
						// worker listening
					}
				)
				.on( 'exit', function ( code, signal )
					{
						if ( signal )
						{
							console.log( 'worker was killed by signal: ' + signal )
							
							// should we fork a new worker here?
						}
						else if ( code !== 0 )
						{
							console.log( 'worker exited with error code: ' + code )
							
							// worker crashed, fork a new one
							CLUSTER.fork()
						}
						else
						{
							console.log( 'worker success!' )
						}
					}
				)
		}
	}
)()
