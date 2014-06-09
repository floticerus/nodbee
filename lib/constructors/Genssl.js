( function ()
    {
        var FS = require( 'fs' )

        var PATH = require( 'path' )

        var SPAWN = require( 'child_process' ).spawn

        var Queue = require( PATH.join( __dirname, 'Queue' ) )

        /** @constructor */
        function Genssl( opts )
        {
            this.opts = opts || {}

            this.opts.destination = this.opts.destination || __dirname

            this.opts.keyLength = this.opts.keyLength || 2048

            // set default as US, sorry everybody
            this.opts.countryCode = this.opts.countryCode || 'US'

            this.opts.state = this.opts.state || 'Illinois'

            this.opts.locality = this.opts.locality || 'Chicago'

            this.opts.organization = this.opts.organization || 'genssl'

            this.opts.organizationalUnit = this.opts.organizationalUnit || 'genssl'

            this.opts.commonName = this.opts.commonName || 'localhost'

            this.paths = {
                key: PATH.join( this.opts.destination, 'nb-key.pem' ),

                csr: PATH.join( this.opts.destination, 'nb-csr.pem' ),

                cert: PATH.join( this.opts.destination, 'nb-cert.pem' )
            }

            this.queue = new Queue( 1 )
        }

        // more user friendly
        Genssl.generate = function ( opts, callback )
        {
            var genssl = new Genssl( opts )

            genssl.generate( callback )
        }

        Genssl.prototype.generate = function ( callback )
        {
            ( function ( that )
                {
                    that.queue.add( function ( next )
                        {
                            FS.exists( that.paths.key, function ( exists )
                                {
                                    if ( exists )
                                    {
                                        return next()
                                    }

                                    var child = SPAWN( 'openssl', [ 'genrsa', '-out', that.paths.key, that.opts.keyLength ], { stdio: 'inherit' } )

                                    child.on( 'close', function ()
                                        {
                                            next()
                                        }
                                    )
                                }
                            )
                        }
                    )

                    that.queue.add( function ( next )
                        {
                            FS.exists( that.paths.csr, function ( exists )
                                {
                                    if ( exists )
                                    {
                                        return next()
                                    }

                                    // check for CERT_PEM too in case CSR_PEM has been removed
                                    FS.exists( that.paths.cert, function ( exists )
                                        {
                                            if ( exists )
                                            {
                                                return next()
                                            }

                                            var subjString = '/C=' + that.opts.countryCode
                                                + '/ST=' + that.opts.state
                                                + '/L=' + that.opts.locality
                                                + '/O=' + that.opts.organization
                                                + '/OU=' + that.opts.organizationalUnit
                                                + '/CN=' + that.opts.commonName

                                            var child = SPAWN( 'openssl', [ 'req', '-new', '-key', that.paths.key, '-out', that.paths.csr, '-subj', subjString ], { stdio: 'inherit' } )

                                            child.on( 'close', function ()
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

                    that.queue.add( function ( next )
                        {
                            FS.exists( that.paths.cert, function ( exists )
                                {
                                    if ( exists )
                                    {
                                        return next()
                                    }

                                    var child = SPAWN( 'openssl', [ 'x509', '-req', '-in', that.paths.csr, '-signkey', that.paths.key, '-out', that.paths.cert ], { stdio: 'inherit' } )

                                    child.on( 'close', function ()
                                        {
                                            next()
                                        }
                                    )
                                }
                            )
                        }
                    )

                    that.queue.done( function ( err )
                        {
                            if ( err )
                            {
                                return callback( err )
                            }

                            FS.exists( that.paths.csr, function ( exists )
                                {
                                    if ( exists )
                                    {
                                        // remove CSR_PEM, use async unlink
                                        return FS.unlink( that.paths.csr, function ( err )
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
            )( this )
        }

        module.exports = Genssl
    }
)()
