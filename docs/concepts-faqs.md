[Docs](index.md) >

# Concepts and FAQs

## Security Model

The main premise of μAdmin is that, with the release of the [Looker API's OAuth interface](https://docs.looker.com/reference/api-and-integration/api-cors#oauth_authentication_overview), applications can now invoke REST API endpoints on behalf of a user, without having access to user credentials, and without even knowing the user's identity before interacting with the Looker API.

However, because OAuth only authorizes the API to do things that the authenticated user can do themselves, an additional mechanism may be required to execute administrative flows.

μAdmin solves this by first using OAuth to verify the identity of the Looker user, and optionally to further validate their access, and then using a service-account to execute administrative API calls as requested by the user, but only subject to the allow-listed logic deployed to the server, which is under change management.

## FAQS

### How does μAdmin relate to the Extension Framework?

The [Extension Framework](https://docs.looker.com/data-modeling/extension-framework/extension-framework-intro) (EF) provides a convenient way to build custom UIs as a first-class experience within the Looker application. The EF provides an authenticated REST API client to the application, but it is limited to API calls that the user is directly authorized to make. This is because EF applications are executed by the browser, and not by a server, so code-based security controls cannot be enforced.

By contrast, the core value proposition of μAdmin is a server, with OAuth to provide authentication.

However, since the EF permits application to consume external OAuth services, it is likely that μAdmin will provide an EF-based version of its UI in a future release. (It will still require the deployment of a corresponding server.)

### Why does μAdmin's flow framework not expose the API via the official Looker SDK?

No particularly important reason. I've used my own API functions before the existence of the [Looker JS SDK](https://www.npmjs.com/package/@looker/sdk), and carried them forward to this project. I also somewhat prefer the smaller codebase size, though it is at the expense of not having generated method annotations. If there is community demand for an interface via the SDK, it may be added in the future. 

### Can μAdmin fully replace the first-party admin UI/role?

Although many/most administrative actions in the UI have a corresponding endpoint in the public REST API for μAdmin to use, some endpoints are missing, private, or marked as beta. In such cases, the endpoint likely does exist (since the Looker UI itself is a web-based application that uses REST APIs) but it not publicly exposed. If you have a particularly important use cases that would be enabled by exposing such an endpoint, consider speaking with your Looker Success team or submitting a feature request via the in-product "? > Product Idea" menu option. You can also submit an issue against this Github repo and I can help you look into it.
