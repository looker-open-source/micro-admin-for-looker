# μAdmin for Looker

μAdmin for Looker, or μAdmin for short, allows the owner of a [Looker](https://looker.com/) instance to easily define administrative flows and selectively expose those flows to end users. Once μAdmin has been deployed, non-administrative end users will be able to execute allowlisted administrative flows with highly granular access controls and logging.

μAdmin includes both (1) a library of pre-written administrative flows, and (2) a framework for writing new administrative flows with minimal development overhead.

Some key features include:

- OAuth authentication so all flow executions are access controlled based on the invoking Looker user
- Robust audit logging automatically-applied for all API calls
- Pre-authenticated API clients when writing new flows, to make either user-permissioned API calls, or admin-permissioned API calls from a service account
- Approachable implementation in NodeJS with minimal dependencies to simplify forking & modifying the service
- Multi-instance flows supported

## Deployment

- Clone the repo
- In the `server` directory:
  - Configure `config.json` (see example in `config.example.json`)
  - Run `npm install`
  - Run `node index.js` (or your prefered approach to starting node)
- Configure Looker
  - At /admin/embed , add the origin/domain of your server into the allowlist
- Misc.
  - If your Looker instance uses a self-signed certificate or private CA, you will need to run Node with [extra certificates](https://nodejs.org/api/cli.html#cli_node_extra_ca_certs_file)
  
## About

### License

See `LICENSE.txt`

### Support

μAdmin is NOT officially supported by Looker, Google Cloud, or Google. Please do not contact support for issues. Issues may be reported via the Github Issues tracker, but no SLA or warranty exists that they will be resolved.

### Authors

μAdmin has primarily been developed by [Fabio Beltramini](https://github.com/fabio-looker). See [all contributors](graphs/contributors)

### Contributing

See `docs/contributing.md`

### Code of Conduct

See `docs/code-of-conduct.md`