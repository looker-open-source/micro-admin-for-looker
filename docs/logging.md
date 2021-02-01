[Docs](index.md) >

# Logging

## API Logging Metadata

All calls to the framework-provided Looker API functions will log the following metadata for auditability:

- `r` - An hex string identifier for the current webserver request
- `f` - The flow ID for the current flow
- `h` - The host ID or nickname for the target Looker instance/host
- `u` - The user ID of the invoking user in that Looker instance
- `a` - Whether the API call was executed via the admin API client rather than the user's own API client
- `call` - The endpoint (verb + path) called
- `code` - The HTTP response code
- `msec` - Elapsed time in milliseconds, including the transparent token refresh call, if any
- `resId` - If the response was an object with an `id`, the id
- `resLen` - If the response was an array, its length