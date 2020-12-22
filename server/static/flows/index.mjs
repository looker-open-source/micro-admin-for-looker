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
import {offon,$,$$,message} from '../lib/utils.mjs'

	
main().catch(e=>message(e.message||e))

$("#filter-input").addEventListener("change",  evt=>applyFilter(evt.target.value))
$("#filter-input").addEventListener("keyup",debounce(200,evt=>applyFilter(evt.target.value)))

async function main(retry=true){
	const auth = await lookerAuth.get()
	const host = lookerAuth.primaryHost(auth)
	if(!host){
		document.location = '/hosts'	
	}
	if(!lookerAuth.isActive(host)){
		if(retry){
			await lookerAuth.login(host.id)
			return main(false)
			}
		else{
			throw "❌ Unable to authenticate"
			}
		}
	
	const response = await fetch("/api/flows",{
		headers:{authorization:`token ${host.access_token}`}
		})
	if(!response.ok){
		throw `❌ Flow listing response error (${response.status})`
		}
	const flowTemplate = $('template#flow').content
	const flows = await response.json()
	$("#flows").appendChild(
		flows
		.map(flow => {
			let el = flowTemplate.cloneNode(true)
			$('.card-link',el).href = `/flow?id=${flow.id}`
			$('.card-label',el).textContent = flow.label || ''
			$('.card-descr',el).textContent = flow.description || ''
			return el
			})
		.reduce((frag,node)=>(frag.appendChild(node),frag), document.createDocumentFragment())
		)
	}

function applyFilter(value){
	const valueUp = value.toUpperCase()
	$$("#flows>*").forEach(card=>{
		if(!value || card.textContent.toUpperCase().includes(valueUp)){
			offon(null,card)
			}
		else{
			offon(card)
			}
		})
	}

function debounce(time,fn){
	let latestTimeout
	return function debounced(...args){
		latestTimeout && clearTimeout(latestTimeout)
		latestTimeout = setTimeout(fn,time,...args)
		}
	}