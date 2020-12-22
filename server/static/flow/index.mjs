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
import {$,offon,urlDecodeObj,message} from '../lib/utils.mjs'

const urlParams = {
	...urlDecodeObj(document.location.search,"?"),
	...urlDecodeObj(document.location.hash,"#")
	}


let jsonEditor

$('#json-editor-submit').addEventListener("click",main)

main().catch(message)

async function main(){
	const auth = await lookerAuth.get()
	const stateErrs = jsonEditor ? jsonEditor.validate() : []
	const state = jsonEditor && !stateErrs.length && jsonEditor.getValue() || {}
	offon("#main>*","#throbber")
	const fetchResponse = await fetch(`/api/flow/${urlParams.id}/execute`,{
		method: 'POST',
		headers: {
		'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			auth:lookerAuth.accessTokens(auth),
			state
			}) 
		})
	if(!fetchResponse.ok){
		throw `Flow execution response error ${fetchResponse.status}`
		}
	const response = await fetchResponse.json()
	offon("#throbber")
	if(response.message){
		message(response.message)
		}
	if(response.prompt){
		resetJsonEditor(response.prompt,response.state)
		offon(null,"#prompt")
		}
	}


function resetJsonEditor(prompt,state){
	if(jsonEditor && jsonEditor.destroy){
		jsonEditor.destroy()
		}
	try{
		jsonEditor = new JSONEditor(
			document.getElementById("json-editor"),
			{
				schema: {
						type:"object",
						title:"Flow Parameters",
						options:{"disable_edit_json":false,"disable_properties":false},
						properties:prompt
					},
				startval: state||{},
				//"required_by_default":true,
				"disable_collapse":true,
				"disable_properties":true,
				"display_required_only":true,
				"keep_oneof_values":true,
				"disable_edit_json":true,
				"theme": "bootstrap4",
				//"iconlib": "spectre" 
				}
			)
		}
	catch(e){
		console.error(`Error setting JSON Editor's schema: ${e.message}`)
		}
	return jsonEditor	
	}
