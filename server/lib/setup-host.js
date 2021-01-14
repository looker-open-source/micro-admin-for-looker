/* 
Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const LookerServerApi = require('./looker-server-api.js')
const Logger = require('./logger.js')
const package = require('../package.json')

module.exports = async function setupHost(config, host){
	const logger = Logger({hostId:host.nickname,flowId:"(Internal) setup-host"})
	logger(`🔧 Validating host ${host.id}`)

	// Validate basic properties locally
	if(!config.oauthClientAppGuid
		&& !host.oauthClientAppGuid
		)										{throw `Config is missing 'oauthClientAppGuid'`}
	if(!host.id)								{throw `Host is missing an id`}
	if(!host.uiHost)							{throw `Host ${host.id} is missing 'uiHost'`}
	if(!host.apiHost)							{throw `Host ${host.id} is missing 'apiHost'`}
	if(!host.admin_credentials)					{throw `Host ${host.id} is missing 'admin_credentials'`}
	if(!host.admin_credentials.client_id)		{throw `Host ${host.id} is missing 'admin_credentials.client_id'`}
	if(!host.admin_credentials.client_secret)	{throw `Host ${host.id} is missing 'admin_credentials.client_secret'`}
	

	// Declare OAuth Client values that we expect to find on the host
	const oauthClientAppGuid = 
		host.oauthClientAppGuid 
		|| config.oauthClientAppGuid 
		|| package.name.toLowerCase()
	const redirect_uri = `${config.callbackUrlPrefix}/login-popup`
	const expectedOAuthClientBody = {body:{
		client_guid: oauthClientAppGuid,
		redirect_uri,
		display_name: package.display_name,
		description: package.description,
		enabled: true,
		}}

	// Instantiate service account API to check the OAuth Client config
	const api = LookerServerApi({
		host: host.apiHost,
		clientId: host.admin_credentials.client_id,
		clientSecret: host.admin_credentials.client_secret,
		console:logger
		})

	// Check credentials
	try{
		await api('user')
		// (maybe later also check service account's role)
		logger(`✅ API Credentials Ok`)
		}
	catch(e){
		logger("Unable to run test API call. "+(e.message||''))
		throw `❌ Unable to run test API call. Check apiHost and credentials for ${host.id}?`
		}

	// Fetch existing OAuth Client objects, and look for ours by id
	const oauthClients = await api(`GET oauth_client_apps.client_guid,redirect_uri,enabled`)
	let myOauthClient = oauthClients.find(c=>c.client_guid === oauthClientAppGuid)

	//If not found, create it
	if(!myOauthClient){
		logger(`Outh Client '${oauthClientAppGuid}' not found. Creating new OAuth Client`)
		const resp = await api(`POST oauth_client_apps/${oauthClientAppGuid}`, expectedOAuthClientBody)
		const recheckOauthClients = await api(`GET oauth_client_apps.client_guid,redirect_uri,enabled`)
		myOauthClient = recheckOauthClients.find(c=>c.client_guid === oauthClientAppGuid)
		}

	//Check for issues with the OAuth Client object
	const issues = []
	if(!myOauthClient.enabled){
		issues.push(`Host ${host.id} has a registered client '${oauthClientAppGuid}', but it is disabled`)
		}	
	if(myOauthClient.redirect_uri !== redirect_uri){
		issues.push(`Host ${host.id} has a registered client '${oauthClientAppGuid}', but its redirect URI (${myOauthClient.redirect_uri}) does not match the redirect URI (${redirect_uri}) for this server. Update either callbackHost or oauthClientAppGuid`)
		}

	//Determine what to do with OAuth Client issues if any
	if(!issues.length){
		logger(`✅ OAuth Client Ok`)
		}
	else {
		issues.forEach(i => logger(`⚠ OAuth Client issue: ${i}`))
		if(!host.forceOauthClientConfig){
			throw `❌ Mismatch of OAuth Client settings. Set hosts[${host.id}].forceOauthClientConfig: true to force update`
			}
		else{
			await api(`PATCH oauth_client_apps/${oauthClientAppGuid}`, expectedOAuthClientBody)
			}
		}

	// Once everything is OK with the OAuth Client, also check CORS. As of 2020-01, there is no way to force/override this via API
	// Inferring the origin for XHR calls from the origin of the OAuth Callback URL Prefix. In all cases I can think of, these should be the same origin
	const origin = (config.callbackUrlPrefix.match(/https?:\/\/[^\/?#]+/)||{})[0]
	let corsApiResponse
	try{corsApiResponse = await api(`user`,{headers:{origin},fullResponse:true})}
	catch(e){}
	const corsIsAllowed = corsApiResponse && corsApiResponse.headers['access-control-allow-origin'] == origin
	if(corsIsAllowed){
		logger(`✅ CORS configuration OK`)
		}
	else{
		throw `❌ Host ${host.id} did not respond correctly to a request with origin: ${origin}. Please add the origin to the allow list at https://${host.uiHost}/admin/embed`
		}
	}