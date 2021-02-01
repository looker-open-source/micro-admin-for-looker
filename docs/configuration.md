[Docs](index.md) >

# Configuration

## Configuration Reference

<ul>
<li><code>server/config.json</code>
	<ul>
	<li><details><summary><code>port</code></summary>
	Required. A number for the port that the server will listen on. (Currently only http, not https, is provided. Add an SSL termination load balancer for https/production use)
	</details>
	</li>
	<li><details><summary><code>callbackUrlPrefix</code></summary>
	Required. A URL prefix for the callback URL used in the Looker OAuth process. `/login-popup` will be added to the prefix to form the full callback URL. Example values might be `http://localhost:3000` for development or `https://micro-admin-for-looker.mydomain.com` for production.
	</details>
	<li><details><summary><code>serveUi</code></summary>
	Optional, default true. Whether the server should also serve the default static UI. You may want to use change flag when deploying static UI assets to a CDN instead.
	</details>
	</li>
	<li><details><summary><code>corsOrigin</code></summary>
	Optional. A string containing an origin, or an array of strings containing origins, from which the server should accept CORS requests, if any. In the default configuration of `serveUi`, CORS is not needed since the UI is served from the same origin as the API server. For additional details about accepted arguments see [the `cors` package on NPM](https://www.npmjs.com/package/cors#configuration-options)
	</details>
	</li>
	<li>

	</li?>
	</ul>
</li>
</ul>


	- `server/config.json`
		- oauthClientAppGuid":"micro-admin-for-looker",
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

