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

module.exports = {
	label: "Disable a user",
	handler: async function({state,host,log}){
		
		const {user, adminApi} = host
		
		if(!state.userId){
			log("User to disable not provided.")
			log("Retreiving user list for prompt")
			const allUsers = await adminApi(`users.id,display_name,email,avatar_url,is_disabled`)
			const disableCandidates = allUsers.filter(u =>
				! u.is_disabled // Hide already disabled users
				&& u.id !== user.id // Don't suggest our user to disable themselves, for safety
				)
				.sort((a,b)=>(a.display_name||'').localeCompare(b.display_name||''))
			log(`Returning list of ${disableCandidates.length} users for prompt`)
			return {
				prompt: {
					userId: {
						type: "string",
						required:true,
						enum:disableCandidates.map(u=>u.id),
						options:{enum_titles: disableCandidates.map(u=>`${u.display_name} (${u.id})`)}
						}
					}
				}
			}
		log(`Disabling requested user ${state.userId}`)
		await adminApi(`PATCH users/${state.userId}`,{body:{
			is_disabled:true
			}})
		}
	}