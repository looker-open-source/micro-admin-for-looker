[Docs](index.md) >

# Configuration

## Configuration Example

See [`server/config.example.json`](../server/config.example.json)

## Configuration Reference

<ul>
<li><code>server/config.json</code>
	<ul>
	<li><details><summary><code>callbackUrlPrefix</code></summary>
	Required. A URL prefix for the callback URL used in the Looker OAuth process. `/login-popup` will be added to the prefix to form the full callback URL. Example values might be `http://localhost:3000` for development or `https://micro-admin-for-looker.mydomain.com` for production.
	</details>
	</li>
	<li><details><summary><code>corsOrigin</code></summary>
	Optional. A string containing an origin, or an array of strings containing origins, from which the server should accept CORS requests, if any. In the default configuration of `serveUi`, CORS is not needed since the UI is served from the same origin as the API server. For additional details about accepted arguments see [the `cors` package on NPM](https://www.npmjs.com/package/cors#configuration-options)
	</details>
	</li>
	<li><details><summary><code>oauthClientAppGuid</code></summary>
	Optional, default "micro-admin-for-looker". A string that identifies this application within Looker's OAuth apps registry. You should normally not change this setting unless you are trying to connect multiple deployments of μAdmin to the same Looker instance.
	</details>
	</li>
	<li><details><summary><code>port</code></summary>
	Required. A number for the port that the server will listen on. (Currently only http, not https, is provided. Add an SSL termination load balancer for https/production use)
	</details>
	</li>
	<li><details><summary><code>primaryHostId</code></summary>
	Required. A "host id" string that matches one of the entries in the hosts object. All flows that do not specify a different host will operate against this primary host by default, and this host will be exposed via the singular version of the `host` argument in flows.
	</details>
	</li>
	<li><details><summary><code>serveUi</code></summary>
	Optional, default true. Whether the server should also serve the default static UI. You may want to use change flag when deploying static UI assets to a CDN instead.
	</details>
	</li>
	<li><details><summary><code>flows</code></summary>
	Required. An object, where each entry represents one flow. Each entry's key should match the filename of a file in the server/flows directory
	</details>
	</li>
	<li><details><summary><code>flows.*.label</code></summary>
	Optional. Overrides the label displayed to the user
	</details>
	</li>
	<li><details><summary><code>flows.*.description</code></summary>
	Optional. Overrides the description displayed to the user.
	</details>
	</li>
	<li><details><summary><code>flows.*.disabled</code></summary>
	Optional. Set to true to disable the flow while still keeping the entry in the config.
	</details>
	</li>
	<li><details><summary><code>flows.*.requiredGroups</code></summary>
	Required. An array containing zero or more Looker Group IDs that the user must belong to to invoke this flow.
	</details>
	</li>
	<li><details><summary><code>hosts</code></summary>
	Required. An object, where each entry represents one Looker instance and the key value becomes its ID. Often there will only be one entry.
	</details>
	</li>
	<li><details><summary><code>hosts.*.apiHost</code></summary>
	Required. An HTTP host (domain + optional port) where API requests should be directed. For customers on Looker's AWS infrastructure, this is often `my-company.looker.com:19999`. For customers on Looker's GCP infrastructure, this is the same as your uiHost, usually `my-company.cloud.looker.com`. Do not specify a scheme/protocol - only HTTPS is supported.
	</details>
	</li>
	<li><details><summary><code>hosts.*.uiHost</code></summary>
	Required. An HTTP host (domain + optional port) where UI requests should be directed (i.e. the OAuth credentials screen). For customers on Looker's AWS infrastructure, this is often `my-company.looker.com`. For customers on Looker's GCP infrastructure, this is the same as your apiHost, usually `my-company.cloud.looker.com`. Do not specify a scheme/protocol - only HTTPS is supported.
	</details>
	</li>
	<li><details><summary><code>hosts.*.apiCredentials</code></summary>
	Required. An object containing a `client_id` and `client_secret` from a Looker API credential to use as the service account.
	</details>
	</li>
	<li><details><summary><code>hosts.*.oauthClientAppGuid</code></summary>
	Optional. A host-specific override for `oauthClientAppGuid`.
	</details>
	</li>
	</ul>
</li>
<li><code>ui/static/config.js</code>
	<ul>
	<li><details><summary><code>apiPrefix</code></summary>
	Required. A URL prefix for API calls. A blank string will cause API calls to be sent to the UI's origin, which works when the server is configured with serveUi:true
	</details>
	</li>
	</ul>
</li>
</ul>
