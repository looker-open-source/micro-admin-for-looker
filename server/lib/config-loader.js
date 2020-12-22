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

module.exports = function configloader(rawConfig){
	return {
		port:8080,
		oauthClientId:"micro-admin-for-looker",
		callbackHost:"http://localhost:8080",
		...rawConfig,
		hosts:objectMap(rawConfig.hosts, ([hostId,hostConfig])=>[hostId,{
			id:hostId,
			uiHost:hostId,
			apiHost:hostId,
			nickname:hostId.replace(/:\d+$/).replace(/\.looker\.com/,""),
			...hostConfig
			}])
		}
	}

function objectMap(obj, mapper){
	return Object.fromEntries(Object.entries(obj).map(mapper))
	}