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
const logger = require('./logger.js')
const package = require('../package.json')

module.exports = async function setupHost(config, host){
	if(!config.oauthClientAppGuid
		&& !host.oauthClientAppGuid
		)										{throw `Config is missing 'oauthClientAppGuid'`}
	if(!host.id)								{throw `Host is missing an id`}
	if(!host.uiHost)							{throw `Host ${host.id} is missing 'uiHost'`}
	if(!host.apiHost)							{throw `Host ${host.id} is missing 'apiHost'`}
	if(!host.admin_credentials)					{throw `Host ${host.id} is missing 'admin_credentials'`}
	if(!host.admin_credentials.client_id)		{throw `Host ${host.id} is missing 'admin_credentials.client_id'`}
	if(!host.admin_credentials.client_secret)	{throw `Host ${host.id} is missing 'admin_credentials.client_secret'`}
	

	// The remainder of the function will check the existence of the expected OAuth Client object on the instance using the admin API creds for host
	const oauthClientAppGuid = 
		host.oauthClientAppGuid 
		|| config.oauthClientAppGuid 
		|| package.name.toLowerCase()
	const redirect_uri = `${config.callbackUrlPrefix}/login-popup`
	const api = LookerServerApi({
		host: host.apiHost,
		clientId: host.admin_credentials.client_id,
		clientSecret: host.admin_credentials.client_secret,
		console:logger({hostId:host.nickname})
		})
	
	// Fetch existing OAuth Client objects, and look for ours by id
	const oauthClients = await api(`GET oauth_client_apps.client_guid,redirect_uri,enabled`)
	const myOauthClient = oauthClients.find(c=>c.client_guid === oauthClientAppGuid)
	if(!myOauthClient){
		const resp = await api(`POST oauth_client_apps/${oauthClientAppGuid}`,{body:{
			client_guid: oauthClientAppGuid,
			redirect_uri,
			display_name: package.display_name,
			description: package.description,
			enabled: true,
			}})
		return
		}

	//Check for issues with the existing OAuth Client object
	const issues = []
	if(!myOauthClient.enabled){
		issues.push(`Host ${host.id} has a registered client '${oauthClientAppGuid}', but it is disabled`)
		}	
	if(myOauthClient.redirect_uri !== redirect_uri){
		issues.push(`Host ${host.id} has a registered client '${oauthClientAppGuid}', but its redirect URI (${myOauthClient.redirect_uri}) does not match the redirect URI (${redirect_uri}) for this server. Update either callbackHost or oauthClientAppGuid`)
		}

	//Determine what to do with issues if any
	if(!issues.length){
		return
		}
	if(issues.length && !host.forceOauthClientConfig){
		throw issues.join("\n")
		}
	if(issues.length && host.forceOauthClientConfig){
		console.warn(`[Overriding Issues]\n${issues.join('\n')}`)
		await api(`PATCH oauth_client_apps/${oauthClientAppGuid}`,{body:{
			client_guid: oauthClientAppGuid,
			redirect_uri,
			display_name: package.display_name,
			description: package.description,
			enabled: true,
			}})
		return
		}
	}