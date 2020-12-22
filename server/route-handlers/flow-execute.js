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

const LookerServerApi = require('../lib/looker-server-api.js')
const logger = require('../lib/logger.js')
const package = require('../package.json')
const appId = package.name.toLowerCase()+'-v'+package.version.split('.')[0]

module.exports = function flowExecute({hosts,flows,primaryHostId}){
	const serverHosts = hosts
	return async function flowExecuteExpressHandler(req, res, next) {
		try{
			const requestId = req.id

			//Get the relevant flow
			const flowId = req.params.flow
			const flow = flows[flowId]

			//Determine the relevant hosts
			const hostList = flow && flow.hostList || [primaryHostId].filter(Boolean)

			//Authorize the user against all relevant hosts
			const asyncHostEntries = hostList.map(async hostId => {
				const serverHost = serverHosts[hostId]
				const loggerSettings = {requestId,flowId,hostId:serverHost.nickname,adminBootstrap:false}
				try{
					//Check that a token is present
					const userToken = req.body && req.body.auth && req.body.auth[hostId]
					if(!userToken){
						let message = `Flow '${flowId}' uses host '${hostId}', which client has not provided authentication for`
						logger(loggerSettings)(message)
						return [hostId,{error:message}]
						}
					
					// Try to use the token (& fetch user info for future steps)
					const verifyUserApi = LookerServerApi({
						host:serverHost.apiHost,
						token:userToken,
						authStep:"skip",
						appId,
						console:logger(loggerSettings)
						})
					const user = await verifyUserApi("user.id,first_name,last_name,display_name,email,group_ids")
					if(!user || !user.id){
						let message = `Unable to authenticate user on '${hostId}'`
						logger(loggerSettings)(message)
						return [hostId,{error:message}]
						}

					// Setup user-logged Admin API
					const adminApi = serverHost.adminApi = serverHost.adminApi || LookerServerApi({
						host: serverHost.apiHost,
						clientId: serverHost.admin_credentials.client_id,
						clientSecret: serverHost.admin_credentials.client_secret,
						appId
						})
					const loggedAdminApi = (endpointSpec, options={}) => adminApi(endpointSpec, {
						...options,
						console:logger({
							...loggerSettings,
							userId:user.id,
							adminBootstrap:true
							})
						})
					
					// Set up User API
					const userApi = LookerServerApi({
						host:serverHost.apiHost,
						token:userToken,
						authStep:"skip",
						appId,
						console: logger({
							...loggerSettings,
							userId:user.id
							})
						})
					return [hostId,{user,userApi,adminApi:loggedAdminApi}]
					}
				catch(e){
					logger(loggerSettings)(e.message || e)
					return [hostId,{error:e.message || "Unexpected Error"}]
					}
				})
			
			const hosts = Object.fromEntries(await Promise.all(asyncHostEntries))
			const hostErrors = Object.values(hosts).map(h=>h&&h.error).filter(Boolean).join('\n')
			if(hostErrors.length){
				return next({status:401,message:hostErrors})
				}
			
			//Once we have authenticated the request, let the user know if the flow they requested does not exist
			if(!flowId.match(/^[-_a-zA-Z0-9]+$/)){
				return next({status:400, message: "Invalid flow id"})
				}
			if(!flows.hasOwnProperty(flowId)){
				return next({status:404, message:"No such flow"})
				}
			
			// Check that user is in requiredGroups, if any
			const groupsApproved = (flow.requiredGroups||[]).map(groupSpec=>{
				const specParts = (''+groupSpec).split("/")
				const hasHost = specParts.length > 1
				const hostId = hasHost ? specParts[0] : primaryHostId 
				const groupId = parseInt(hasHost ? specParts[1] : specParts[0])
				const host = hosts[hostId]
				const serverHost = serverHosts[hostId]
				const loggerSettings = {requestId,flowId,hostId:serverHost.nickname}
				if(!host){
					logger(loggerSettings)(`Invalid hostId ${hostId} in ${flowId} requiredGroup`)
					return false
					}
				if(host.user.group_ids.includes(groupId)){
					logger(loggerSettings)(`User is not in required group ${groupId}`)
					return true
					}
				return false
				})
			if(!groupsApproved.every(Boolean)){
				return next({status:403, message:"User not authorized to use this flow"})
				}
				
			//Let's do the flow
			try{
				const state = req.body.state || {}
				const host = hosts[primaryHostId]
				const flowResponse = await flow.handler({
					state,
					host,
					hosts,
					log: logger({requestId,flowId})
					})
				res
					.status(flowResponse && flowResponse.status || 200)
					.json(flowResponse || "ok")
				}
			catch(err){
				logger({requestId,flowId})(`Unhandled exception within flow: ${err.message||'unknown'}`)
				res
					.status(err && err.status  || 500)
					.json(  err && err.message ||  "Unknown error")
				}
			}
			catch(err){
				console.error(err)
				res
					.status(err && err.status  || 500)
					.json(  err && err.message || "Unknown error")	
			}
		}
	}