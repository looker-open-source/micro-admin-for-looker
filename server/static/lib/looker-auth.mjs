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

import {tryJsonParse} from './utils.mjs'

export default {
	login: lookerAuth_login,
	get: lookerAuth_get,
	set: lookerAuth_set,
	isActive: lookerAuth_isActive,
	isConnected: lookerAuth_isConnected,
	primaryHost: lookerAuth_primaryHost,
	accessTokens: lookerAuth_accessTokens
	}

const defaultStorageKey = "looker-auth"
const defaultStorage = {
	get: function storage_get(){return tryJsonParse(localStorage.getItem(defaultStorageKey)) || {}},
	set: function storage_set(s){
		const s0 = tryJsonParse(localStorage.getItem(defaultStorageKey)) || {}
		const hosts0 = s0.hosts || {}
		const hostIds = [...Object.keys(hosts0), ...Object.keys(s.hosts)].filter(unique)
		localStorage.setItem(defaultStorageKey,JSON.stringify({
			...s0,
			...s,
			hosts:Object.fromEntries(hostIds.map(id=>[id,{...hosts0[id],...s.hosts[id]}]))
			}))
		}
	}

async function lookerAuth_login({
	hostId,
	storage = defaultStorage
	}={}){
	const auth = await storage.get()
	hostId = hostId || auth.hostId
	let host = auth.hosts && auth.hosts[hostId] || {}
	if(host.access_token && host.expires > Date.now()/1000){
		return host
		}
	if(host.refresh_token && host.refreshExpires > Date.now/1000){
		const updatedHost = await refreshToken()
		await storage.set({hosts:{[hostId]:updatedHost}})
	}
	else{
		const newHost = await newToken()
		await storage.set({hostId: newHost.id, hosts:{[newHost.id]:newHost}})
	}
	return await storage.get()

	async function refreshToken(){
		const response = await fetch(`https://${host.apiHost}/api/token`,{
			method: "POST",
			credentials: 'omit',
			headers:{"Content-Type": 'application/json; charset=UTF-8'},
			body: JSON.stringify({
				refresh_token: host.refresh_token
				})
			})
		if(!response.ok){throw response.statusText}
		const responseObject = await response.json()
		const {expires_in, ...tokenResult} = responseObject
		const expires = parseInt(Date.now()/1000) + expires_in
		const updatedHost = {
			...host,
			...tokenResult,
			expires
			}
		}
	async function newToken(){
		const asyncPopupResponse = new Promise(resolve =>
			window.addEventListener("message",evt=>{
				if(evt.origin === document.location.origin && evt.data.host){
					resolve(evt.data.host)
					}
				})
			)
		window.open(`/login-popup?hostId=${hostId}`,'login-popup','left=100,top=200,innerWidth=640,innerHeight=800')
		return await asyncPopupResponse
		}
	}
async function lookerAuth_get({storage=defaultStorage}={}){
	const stored = await storage.get() 
	return {
		hosts:{},
		...(stored||{})
		}
	}

async function lookerAuth_set(state,{storage=defaultStorage}={}){
	return await storage.set(state)
	}

function lookerAuth_isConnected(host){
	return lookerAuth_isActive(host) || host && host.refresh_token && host.refreshExpires > Date.now()/1000
	}
function lookerAuth_isActive(host){
	return host && host.access_token && host.expires > Date.now()/1000
	}
function lookerAuth_primaryHost(auth={}){
	const hosts = auth.hosts || {}
	return hosts[auth.primaryHostId]
	}
function lookerAuth_accessTokens(auth){
	return auth && auth.hosts && Object.fromEntries(
		Object.entries(auth.hosts)
		.filter(([h,host])=>lookerAuth_isActive(host))
		.map(([h,host])=>[h,host.access_token])
		)
	}
function unique(x,i,arr){return arr.indexOf(x)==i}