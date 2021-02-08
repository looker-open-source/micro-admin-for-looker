# μAdmin for Looker

μAdmin for Looker, or μAdmin for short, allows the owner of a [Looker](https://looker.com/) instance to easily define administrative flows and selectively expose those flows to end users. Once μAdmin has been deployed, non-administrative end users will be able to execute allowlisted administrative flows with highly granular access controls and logging.

μAdmin includes both (1) a library of pre-written administrative flows, and (2) a framework for writing new administrative flows with minimal development overhead.

Some key features include:

- OAuth authentication so all flow executions are access controlled based on the invoking Looker user
- Robust audit logging automatically applied for all API calls
- Pre-authenticated API clients when writing new flows, to make either user-permissioned API calls, or admin-permissioned API calls from a service account
- Approachable implementation in NodeJS with minimal dependencies to simplify forking & modifying the service
- Multi-instance flows supported

Read more about configuration, writing flows, deployment, and other topics [in the docs](https://github.com/looker-open-source/micro-admin-for-looker/blob/main/docs/index.md)

## License

See `LICENSE.txt`
