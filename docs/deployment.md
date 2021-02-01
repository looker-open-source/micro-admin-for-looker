[Docs](index.md) >

# Deployment

## Looker Configuration

- At /admin/embed , add the origin/domain of your server into the [embed allowlist](https://docs.looker.com/admin-options/platform/embed)
- Create an administrative "service account" user, with API Credentials

## Basic/Local Deployment

- Clone the repo
- From the `server` directory:
  - Configure `config.json`
    - See example in `config.example.json`
    - For the basic deployment, set `serveUi:true`, to serve both the API and UI from the same server
  - Run `npm install`
  - Run `node index.js` (or your prefered approach to starting node)

## Advanced or Production Deployment

### HTTPS

μAdmin does not currently provide HTTPS. You should access it through an SSL terminating load balancer/proxy.

### Node production mode

μAdmin does not currently provide any scripts/commands to start the application in production mode. For optimal performance, check Node.js docs about running Node in production mode, including setting `NODE_ENV=production`


### Separate API & UI Server

For better performance of static assets, you may want to serve static/UI assets from a CDN

- Deploy the repository to a server that will serve the API calls:
	- Configure `server/config.json > serveUi:false`
	- Configure `server/config.json > corsOrigin` to the origin that will serve the static UI files
- Deploy the static UI to CDN/server:
	- Set `apiPrefix`, referencing the origin or URL prefix of your API server
	- Make sure the CDN/server is configured to serve `index.xhtml` files as the default/index files for directories
	- Deploy the files to the CDN/server

## Miscellaneous

μAdmin makes back-end API calls to Looker over HTTPS. Firewalls should be configured accordingly. If your Looker instance uses a self-signed certificate or private CA, you will need to run Node with [extra certificates](https://nodejs.org/api/cli.html#cli_node_extra_ca_certs_file)