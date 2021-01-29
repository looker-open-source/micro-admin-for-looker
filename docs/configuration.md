
#Configuration Reference

## Contents

	- `server/config.json`
		- port:3000,
		- oauthClientAppGuid":"micro-admin-for-looker",
		- callbackUrlPrefix":"http://localhost:3000",
		- primaryHostId":"sandboxcl.dev.looker.com",
		- corsOrigin
		- serveUi
		- hosts
		- hosts.*.apiHost
		- hosts.*.uiHost
		- hosts.*.adminCredentials
		- flows
		- flows.*.label
		- flows.*.description
		- flows.*.disabled
		- flows.*.requiredGroups
		- flows.*.hostId
	- `ui/static/config.js`


### corsOrigin

Optional. A string containing an origin, or an array of strings containing origins, from which the server should accept CORS requests, if any. In the default configuration along with an undefined or true `serveUi` option, CORS is not needed since the UI is served from the same origin as the API server. For additional details about accepted arguments see [`cors` on NPM](https://www.npmjs.com/package/cors#configuration-options)

