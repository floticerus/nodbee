( function ()
    {
        var FS = require( 'fs' )

        var PATH = require( 'path' )

        var SPAWN = require( 'child_process' ).spawn

        var Queue = require( 'nbqueue' )

		// generates a self-signed x509 certificate and key
        module.exports = function ( opts, callback )
        {
            opts = opts || {}

            opts.destination = opts.destination || __dirname

            opts.keyLength = opts.keyLength || 2048

            // set default as US, sorry everybody
            opts.countryCode = opts.countryCode || 'US'

            opts.state = opts.state || 'Illinois'

            opts.locality = opts.locality || 'Chicago'

            opts.organization = opts.organization || 'genssl'

            opts.organizationalUnit = opts.organizationalUnit || 'genssl'

            opts.commonName = opts.commonName || 'localhost'

            paths = {
                key: PATH.join( opts.destination, 'nb-key.pem' ),

                csr: PATH.join( opts.destination, 'nb-csr.pem' ),

                cert: PATH.join( opts.destination, 'nb-cert.pem' )
            }

            var queue = new Queue( 1 )

            queue.add( function ( next )
                {
                    FS.exists( paths.key, function ( exists )
                        {
                            if ( exists )
                            {
                                return next()
                            }

                            var child = SPAWN( 'openssl', [ 'genrsa', '-out', paths.key, opts.keyLength ], { stdio: 'inherit', detached: true } )

                            child.on( 'exit', function ()
                                {
                                    next()
                                }
                            )
                        }
                    )
                }
            )

            queue.add( function ( next )
                {
                    FS.exists( paths.csr, function ( exists )
                        {
                            if ( exists )
                            {
                                return next()
                            }

                            // check for CERT_PEM too in case CSR_PEM has been removed
                            FS.exists( paths.cert, function ( exists )
                                {
                                    if ( exists )
                                    {
                                        return next()
                                    }

                                    var subjString = '/C=' + opts.countryCode
                                        + '/ST=' + opts.state
                                        + '/L=' + opts.locality
                                        + '/O=' + opts.organization
                                        + '/OU=' + opts.organizationalUnit
                                        + '/CN=' + opts.commonName

                                    var child = SPAWN( 'openssl', [ 'req', '-new', '-key', paths.key, '-out', paths.csr, '-subj', subjString ], { stdio: 'inherit', detached: true } )

                                    child.on( 'exit', function ()
                                        {
                                            next()
                                        }
                                    )
                                }
                            )
                        }
                    )
                }
            )

            queue.add( function ( next )
                {
                    FS.exists( paths.cert, function ( exists )
                        {
                            if ( exists )
                            {
                                return next()
                            }

                            var child = SPAWN( 'openssl', [ 'x509', '-req', '-in', paths.csr, '-signkey', paths.key, '-out', paths.cert ], { stdio: 'inherit', detached: true } )

                            child.on( 'exit', function ()
                                {
                                    next()
                                }
                            )
                        }
                    )
                }
            )

            queue.done( function ( err )
                {
                    if ( err )
                    {
                        return callback( err )
                    }

                    FS.exists( paths.csr, function ( exists )
                        {
                            if ( exists )
                            {
                                // remove CSR_PEM, use async unlink
                                return FS.unlink( paths.csr, function ( err )
                                    {
                                        callback( err )
                                    }
                                )
                            }

                            callback()
                        }
                    )
                }
            )
        }
    }
)()
