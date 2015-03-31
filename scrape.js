var path = require("path");
var Promise = require("bluebird");
var objectAssign = require("object-assign"),
	sanitizeResult = require("./sanitize").sanitizeResult,
	jsdom = require( 'jsdom' ),
	fs = require( 'fs' ),
	needle = require( 'needle' )

var readabilityPath = process.env.READABILITY_LIB_PATH ||
                      path.normalize(path.join(__dirname, "vendor", "Readability.js"));

var readabilityScript = fs.readFileSync( readabilityPath, 'utf-8' )

module.exports = function scrape(url, options) {
  options = options || {};
  if (!url) throw new Error("Missing url.");
  return new Promise(function(fulfill, reject) {
	var data = needle.get( url, { 
		compressed: true,
		follow_max: 5
	}, function ( error, response ) {
		if ( error ) return reject( error )
		
		console.error( response )
		
		jsdom.env({
			html: response.body,
			src: [ readabilityScript ],
			done: function ( error, window ) {
				if ( error ) return reject( error )

				var location = window.location

				var readerArgs = {
					spec: location.href,
					host: location.host,
					prePath: location.protocol + "//" + location.host, // TODO This is incomplete, needs username/password and port
					scheme: location.protocol.substr(0, location.protocol.indexOf(":")),
					pathBase: location.protocol + "//" + location.host + 		location.pathname.substr(0, location.pathname.lastIndexOf("/") + 1)
				}

				var article = new window.Readability( readerArgs, window.document ).parse()
				
				var sanitizedArticle = sanitizeResult( article )
				
				window.close()

				fulfill( sanitizedArticle )
			}
		})
	})
  });
};
