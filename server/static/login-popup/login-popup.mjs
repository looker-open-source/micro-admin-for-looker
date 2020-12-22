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

import lookerAuth from "../lib/looker-auth.mjs"

const clientId = "micro-admin-for-looker"
const redirectUrl = document.location.origin + "/login-popup"
const urlParams = {
	...decodeObj(document.location.search,"?"),
	...decodeObj(document.location.hash,"#")
	}

main()

async function main(){

	history.replaceState(null, null, "?")

	const auth = await lookerAuth.get()
	const hostId = urlParams.hostId || auth.primaryHostId
	const host = auth && hostId && auth.hosts && auth.hosts[hostId]

	if(host){
		if(lookerAuth.isActive(host)){
			returnToOpener(host)
			}
		// V2
		// else if(lookerAuth.isConnected(host)){
		// 	lookerAuth.refresh(host)
		// }
		else if(!urlParams.code){
			beginOauthFlow(host)
			}
		else{
			finishOauthFlow(host)
			}
		}
	else {
		setupUi()
		}
}

function returnToOpener(obj){
	window.opener.postMessage(obj, document.location.origin)
	let closer = self
	closer.opener = self
	closer.close()
	}

function setupUi(){
	document.querySelectorAll(".onsubmit-doauthflow").forEach(el=>el.addEventListener("submit",onFormSubmit))
	document.querySelectorAll(".onclick-doauthflow") .forEach(el=>el.addEventListener("click",onFormSubmit))
	document.querySelectorAll(".onclick-hidemessage").forEach(el=>el.addEventListener("click",()=>message("",0)))
	document.querySelector("#host-input").addEventListener("change",onHostChange)
	document.querySelector("#host-input").addEventListener("keyup",onHostChange)

	document.querySelector("#main").style.display='block'

	return

	function onHostChange(evt){
		const hostId = normalizeHostId(evt.target.value)
		const {uiHost,apiHost} = defaultsByHostId(hostId)
		document.querySelector("#host-ui-input").placeholder = uiHost || 'The host or domain of your Looker UI'
		document.querySelector("#host-api-input").placeholder = apiHost || 'The host or domain of your Looker API'
		}
	function onFormSubmit(evt){
		evt.preventDefault()
		const rawHostId = document.querySelector("#host-input").value
		const customUiHost  = document.querySelector("#host-ui-input") .value
		const customApiHost = document.querySelector("#host-api-input").value
		const http = /^http:\/\//i
		if(rawHostId.match(http) || customUiHost.match(http) || customApiHost.match(http)){
			return message("HTTP (unencrypted) is not allowed")
			}
		const hostId = normalizeHostId(rawHostId)
		const defaults = defaultsByHostId(hostId)
		const auth = lookerAuth.get()
		const hosts = auth.hosts || {}
		const host = {
			...hosts[hostId] || {},
			id: hostId,
			uiHost:  customUiHost  || defaults.uiHost,
			apiHost: customApiHost || defaults.apiHost
			}
		lookerAuth.set({hostId, hosts:{[hostId]:host}})
		beginOauthFlow(host)
		}
	function normalizeHostId(host){
		//Only support https
		return (host||'').toLowerCase().replace(/^https?:\/\//,"").replace(/\/.*$/,"")
	}
	function defaultsByHostId(host){
		if(!host){return {}}
		if(host.match(/:1?9999$/)){
			return {
				uiHost: host.replace(/:1?9999$/,":9999"),
				apiHost: host.replace(/:1?9999$/,":19999")
				}
			}
		if(host.match(/\.cloud\/looker\.com$/)){
			return {
				uiHost: host,
				apiHost: host
				}
			}
		return {
			uiHost: host,
			apiHost: host.replace(/(:\d+)?$/,":19999")
			}
		}

	function message(text,timeout){
		let el = document.getElementById("message")
		el[el.innerText !== undefined ? "innerText" : "textContent"] = text
		offon("","#message")
		if(messageTimeout){clearTimeout(messageTimeout)}
		if(setTimeout){messageTimeout = setTimeout(()=>offon("#message"),timeout)}
		}
	}


async function beginOauthFlow(host){
	const state = b64uEncode(randBuffer(8))
	const codeVerifier = b64uEncode(randBuffer(32))
	//const codeChallenge = b64uEncode(await asyncSha256(codeVerifier)) // Standards compliant flow
	const codeChallenge = b64upadEncode(await asyncSha256(codeVerifier)) // Workaround until standards compliant flow is available
	const url =
		"https://"+host.uiHost+"/auth"
		+"?"
		+encodeObj({
			client_id: clientId,
			redirect_uri: redirectUrl,
			response_type: "code",
			scope: "cors_api",
			state: state,
			code_challenge_method: 'S256',
			code_challenge: codeChallenge
			})
	sessionStorage.setItem('looker-auth-codeVerifier',codeVerifier)
	sessionStorage.setItem('looker-auth-oauthLatestState',state)
	document.location.href = url
	}

async function finishOauthFlow(host){
	history.replaceState(null, "My App", '#')
	const codeVerifier = sessionStorage.getItem('looker-auth-codeVerifier')
	const state = sessionStorage.getItem('looker-auth-oauthLatestState')

	if(!codeVerifier){
		alert('Missing session data. Reloading page...')
		document.location.reload()
		}
	if(urlParams.state !== state){
		alert('Unexpected state. Multiple concurrent OAuth flows? Try again?')
		document.location.reload()
		}

	//Exchange the code for a token
	const response = await fetch(`https://${host.apiHost}/api/token`,{
		method: "POST",
		credentials: 'same-origin',
		headers:{"Content-Type": 'application/json; charset=UTF-8'},
		body: JSON.stringify({
			grant_type:"authorization_code",
			client_id: clientId,
			code: urlParams.code,
			code_verifier: codeVerifier,
			redirect_uri: redirectUrl
			})
		})
	if(!response.ok){throw response.statusText}
	const responseObject = await response.json()
	const {expires_in, ...tokenResult} = responseObject
	const expires = parseInt(Date.now()/1000) + expires_in
	const refreshExpires = parseInt(Date.now()/1000) + 30*24*68*60 //https://docs.looker.com/reference/api-and-integration/api-cors#:~:text=refresh_token
	const updatedHost = {
		...host,
		...tokenResult,
		expires,
		refreshExpires
		}

	returnToOpener({
		host: updatedHost
		})
	}

function randBuffer(bytelen){
	var array = new Uint8Array(bytelen || 16)
	crypto.getRandomValues(array)
	return array.buffer
	}
async function asyncSha256(str) {
	const bufferIn = new TextEncoder("utf-8").encode(str)
	const bufferOut = await crypto.subtle.digest("SHA-256", bufferIn)
	return bufferOut
	}
function b64uEncode(buffer){
	var str = ''
	var bytes = new Uint8Array(buffer)
	for (var i = 0, l = bytes.byteLength; i < l; i++) {
		str += String.fromCharCode(bytes[i])
		}
	return btoa(str).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_')
	}
function b64upadEncode(buffer){ //this time with padding
	var str = ''
	var bytes = new Uint8Array(buffer)
	for (var i = 0, l = bytes.byteLength; i < l; i++) {
		str += String.fromCharCode(bytes[i])
		}
	return btoa(str).replace(/\+/g,'-').replace(/\//g,'_')
	}
function encodeObj(o){
	return Object.entries(o).filter(([k,v])=>v!==undefined).map(([k,v])=>encodeURIComponent(k)+"="+encodeURIComponent(v)).join("&")
	}
function decodeObj(str,from){
	return (from?str.slice(1+str.indexOf(from)):str)
		.split('&')
		.map(pair=>pair.split('=').map(decodeURIComponent))
		.reduce((o,[k,...v])=>({...o, [k]:(v||'').join('=')}),{})
	}