/** nodebee cluster master
 *  2014 kevin von flotow
 *
 *  forks number of workers equal to number
 *  of CPUs and reloads them on crash
 */
 ( function ()
	{
		var CLUSTER = require( 'cluster' )
		
		if ( !CLUSTER.isMaster )
		{
			return
		}
		
		var OS = require( 'os' )
		
		var NUM_CPUS = OS.cpus().length || 1
		
		// lock at 2 threads for now
		for ( var i = 0; i < 2; ++i )
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
