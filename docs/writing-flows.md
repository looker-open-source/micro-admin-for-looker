[Docs](index.md) >

# Writing Flows

In addition to allowing you to select flows from a library of pre-written flows, μAdmin lets you write brand new flows by leveraging a convenient framework

To use the framework to write your own flow, create a new js file within the `/server/flows` directory. Copying the hello-world flow makes for an easier start. (Even if you are making a minor adaptation to an existing flow, I recommend making the changes into a copy, so as to avoid potential merge conflicts in the future)

## Flow file structure

The js file should have one default export, which is an object with the following properties:

- `label`: The default label dislayed to the user. (Can be overridden at the config level)
- `description`: The default label displyed to the user. (Can be overridden at the config level)
- `handler`: A (usually async) handler function
	- **Arguments** - The function will be called with an object having the following properties:
		- `state` - An object containing the input provided by the user. Normally, to execute a flow, the handler will be called multiple times, where the first call has an empty state object and prompts the user for additional state data for subsequent handler calls.
		- `host` - An object containing data and functions specific to the primary Looker instance that the flow pertains to
		- `host.user` - Data on the user invoking the flow
		- `host.userApi` - An [API function]() authenticated as the calling user
		- `host.adminApi` - An [API function]() authenticted as the administrative service account
		- `hosts` - An object containing multiple hosts keyed by their ID. Normally you will not use this argument for single-host workflows, and will use `host` instead.
	- **Return value:** The function may return or resolve to an object with the following properties, all of which are optional:
		- `message` - a string to display to the user at the top of the page. If the first character is a non-word character, such as 🛈, ✅, ⚠. ❌, the front-end may use this character to style the message.
		- `prompt` - A [JSON Schema](HTTPs://json-schema.org/) describing the desired properties for the `state` object in the next request that the user should submit. The front-end uses the [JSON Editor](HTTPs://github.com/json-editor/json-editor) library, which includes many advanced options for controlling the input prompt. The JSON Editor repository is recommended reading and contains many examples.
		- `status` - Number for the HTTP response code to use. Defaults to 200, and setting any other value may break functionality.
	- **Throw value:** The function may throw or reject with an object with the following properties, all of which are optional:
		- `status` - Number for the HTTP response code to use. Defaults to 500
		- `message` - Message to display to the user


## API Interface

Flows are provided with an asynchronous function that can be used to call the REST API. For example:

```js
const firstUser = await adminApi(`GET users/1.display_name,email,avatar_url`)
```

In general, the function:

- Is bound to a specific user (via API credential or access token)
- Will transparently renew expired access tokens by default (for credential-based/admin users)
- Is bound to a logger that automatically logs the API request, including [metadata](logging.md)

The function requires an "endpoint spec" argument, and accepts an optional "options" object argument

- **Endpoint spec**
	- A string describing the HTTP endpoint and desired response fields, for example `GET users/${user.id}.display_name`
	- The HTTP verb may be omitted if it is GET
	- The fields may be omitted, but specifying fields is recommended for performance
- **Options object properties**
	- `query` - An object describing the URL querystring. If you specified fields via the shorthand in the endpoint, you do not need to include them here again.
    - `body` - For POST/PATCH requests, the HTTP request body, as an object (i.e., no need to JSON encode it)
	- `authStep` - For credential-based API clients, set to `force` to require an update to the access token, or set to `skip` to prevent updating the access token. By default, the access token is updated (up to one attempt) if missing or expired.
	- `stage` - Set to true to return a representation of the HTTP request instead of making the HTTP call
	- `fullResponse` - Set to true to return the raw HTTP response

