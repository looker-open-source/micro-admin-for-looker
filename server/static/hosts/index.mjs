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

import lookerAuth from '../lib/looker-auth.mjs'
import {$,message} from '../lib/utils.mjs'

let cache = {}

main().catch(message)


async function main(){
	cache = cache.hosts && cache.primaryHostId
		? cache
		: {...cache, ... await fetchHostsAndPrimaryHostId()}
	const {hosts,primaryHostId} = cache
	const auth = await lookerAuth.get()
	const template = $('template#host')
	$("#hosts").innerHTML = ''
	$("#hosts").appendChild(
		Object.values(hosts)
		.map(host => {
			let el = template.content.cloneNode(true)
			$('.card-status',el).textContent = lookerAuth.isConnected(auth.hosts[host.id]) ? "🟢" : ""
			$('.card-label',el).textContent = host.uiHost || ''
			$('.card-descr',el).textContent = host.description || ''
			$('.card-link',el).href = `/login-popup?hostId=${host.id}`
			$('.card-link',el).addEventListener("click",async evt => {
				evt.preventDefault()
				await lookerAuth.login({hostId: host.id})
				main()
				})
			return el
			})
		.reduce((frag,node)=>(frag.appendChild(node),frag), document.createDocumentFragment())
		)
	}

async function fetchHostsAndPrimaryHostId(){
	$("#hosts").textContent = "Loading..."
	const response = await fetch("/api/hosts")
	if(!response.ok){
		throw "Host listing response error"
		}
	const hostsAndPrimaryHostId = await response.json()
	lookerAuth.set(hostsAndPrimaryHostId)
	$("#hosts").textContent = ""
	return hostsAndPrimaryHostId
	}
