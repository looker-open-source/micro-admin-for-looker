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

const defaultHttps = require('https');

module.exports = LookerServerApi

function tryJsonParse(str,dft){
	try{return JSON.parse(str)}
	catch(e){return dft}
	}
const noop = ()=>{}

const globalDefaultConsole = o=>console.log(JSON.stringify(o))

function LookerServerApi({
		host,
		clientId,
        clientSecret,
		token,
		authStep,
		apiVersion = "4.0",
		console = globalDefaultConsole,
		https = defaultHttps,
		appId
	}={}){
	const hostMatch = host && host.match(/^([^\/:]+)\:?(\d*)$/)
	if(!hostMatch){
		throw new Error("API_HOST must specify a host")
		}
	const hostname = hostMatch[1]
	const port = parseInt(hostMatch[2] || "443")
	if(!hostname){throw new Error("host required")}
	if(!clientId && !token){throw new Error("clientId or token required")}
	if(!clientSecret && !token){throw new Error("clientSecret or token required")}
	const defaultConsole = console
	const defaultAuthStep = authStep || token ? "skip" : undefined
	let auth = {accessToken:token}
	
	return api
	
	async function api(endpointSpec,{
			query={},
            body,
            token,
			authStep = defaultAuthStep, // force | skip | undefined 
			contentType = "application/json",
			stage = false,
			fullResponse = false,
			headers,
			console = defaultConsole
		}={}){
		const log = typeof console == "function" ? console : console.log.bind(console)
		const endpointMatch = endpointSpec.match(/^(GET|POST|PUT|PATCH|DELETE)? ?(.*)$/)
		const method = endpointMatch[1]||"GET"
		let fields
		const endpoint = endpointMatch[2]
			.replace(/\.[^?#]+/, str=>{fields=str.slice(1); return ""}) //Extract & trim fields spec
			.replace(/^\//,'') //Trim leading slash
		query = {fields,...query}
		headers = {
			...(appId?{'x-looker-appid': appId}:{}),
			...headers
			}
		const stagedRequest = {
            method,
			hostname,
			port,
			path: `/api/${apiVersion}/${endpoint}`,
			query,
			body,
			contentType,
			headers
			}
		if(stage){return stagedRequest}
		
        if(!clientSecret && !auth.accessToken && !token){throw new Error("clientSecret or token required")}
		if(authStep === 'force' || authStep!=='skip' && !isAuthValid(auth)){
			auth = await getNewAuth({log})
			}
		
		//Separate logging for request and response was a bit much, could become debug-level logging in the future
		//const callId = Math.random().toString(16).slice(2,6)
		//log({t: "API Call Req",call: callId,endpoint: `${method} ${endpoint}`})
		const start= Date.now()
		let elapsed
		while(true){
			const authHeader = {
					...(isAuthValid(auth)?{'Authorization': 'token '+ (token||auth.accessToken)}:{}),	
				}
			const response = await request({...stagedRequest,headers:{...stagedRequest.headers, ...authHeader}}).catch(requestError)
			if(response && response.statusCode == 401 && authStep!=="skip"){
				// Retry failure once, to catch auth expiration issues, if not 'skip' mode
                auth = await getNewAuth({log})
				authStep = "skip" //Don't retry more than once
				continue
				}
			elapsed = Date.now()-start
			const body = response && response.body || {}
			// Not doing separate logging for request and response anymore
			// log({t:"API Call Res", call: callId, msec: elapsed, code: response.statusCode,resLen: body.length,resId: body.id})
			log({
				t:"API Call",
				call: `${method} ${endpoint}`,
				msec: elapsed,
				code: response.statusCode,
				resLen: body.length,
				resId: body.id})
			if(!response || !response.statusCode || response.statusCode>=400){
				throw {
					status: response.statusCode,
					message:`${method} ${host}/${endpoint} API returned a ${response.statusCode} status code`
					}
				}
			return fullResponse ? response : body
			}
			function requestError(e){
				const defaultMessage = "Unknown error with upstream HTTPS request"
				log({
					t:"API Call",
					call: `${method} ${endpoint}`,
					msec: elapsed,
					code: e.code,
					syscall: e.syscall,
					address: e.address,
					err: e.message || defaultMessage
					})
				throw {
					status: 502,
					message: e.message || defaultMessage
					}
			}
		}
	
	function isAuthValid(auth){
        let now = Date.now()
		return auth && auth.accessToken && (auth.expiresAt||now) >= now
		}
	async function getNewAuth({log=noop}={}){
        if(!clientSecret){throw new Error("Unable to refresh Auth token without a client secret")}
		const response = await api("POST login",{
			authStep: 'skip',
			contentType: "application/x-www-form-urlencoded",
			body: {
				client_id: clientId,
				client_secret: clientSecret
				},
			console:log
			})
		if(!response.access_token){
			throw new Error("API Authentication Error")
			}
		return {
			accessToken: response.access_token,
			expiresAt: Date.now()+1000*response.expires_in
			}
		}
	async function request({
			method,
			hostname,
			port,
			path,
			query = {},
			headers,
			body,
			contentType
		}){
		const bodyString = body && (
			contentType == "application/json" ? JSON.stringify(body)
			: contentType == "application/x-www-form-urlencoded" && body && !(body instanceof String)
				? Object.entries(body)
					.map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v))
					.join("&")
			: body
			)
			
		return await new Promise((res,rej)=>{
			let requestConfig = {
				method,
				hostname,
				...(port?{port}:{}),
				path: path
					+ (path.includes("?")?"&":"?")
					+ Object.entries(query)
						.filter(([k,v])=>v!==undefined)
						.map(([k,v])=>encodeURIComponent(k)+"="+encodeURIComponent(v)).join("&")
					,
				headers:{
					...headers,
					...(method[0] == 'P' //POST, PUT, PATCH
						? {
							"Content-Type": contentType,
							"Content-Length": bodyString ? Buffer.byteLength(bodyString) : 0
							}
						: {}
						)
					}
				}
			let req = https.request(requestConfig,
				resp=>{
					let data = '';
					resp.on('data', (chunk) => {data+=chunk;})
					resp.on("error", err => {rej(err)})
					resp.on("abort", err => {rej(err)})
					resp.on('end', () => {
						try{res({
							...resp,
							...(data?{body: tryJsonParse(data,data)}:{})
							})}
						catch(e){rej(e)}
						})
					}
				)
			req.on("error", err => {rej(err)})
			if(body!==undefined){req.write(bodyString)}
			req.end()
			})
		}
	}