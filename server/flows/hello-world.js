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
	label: "Test Flow",
	description: "A test flow that any user can run, and demonstrates main flow features. Does not modify any instance data.",
	handler: async function({state,host,log}){
		
		const {user, adminApi} = host
		
		log("This is a simple message logged on every execution of this flow")

		//Example of conditionally allowing a request. However, group-based checks are available as standard config functionality
		// const allowedUsers = await adminApi(`groups/${allowedGroupId}/users.id`)
		// const allowedUserIds = allowedUsers.filter(u=>!u.is_disabled).map(u=>u.id)
		// log(`Found ${allowedUserIds.length} allowed users`)
		// if(!allowedUserIds.includes(user.id)){
		// 	log(`User (${user.id}) is not an allowed user`)
		// 	return {status:403, type:"json", body:{error:"User not authorized"}}
		// 	}

		if(!state.groupId){
			log("No group ID received. Let's list them for the user to pick one")
			const groups = await adminApi(`groups.id,name`)
			const sortedGroups = groups.sort((a,b)=>(a.name||'').localeCompare(b.name||''))
			return {
				prompt: {
					groupId: {
						type: "number",
						required:true,
						enum:sortedGroups.map(g=>g.id),
						options:{enum_titles: sortedGroups.map(g=>`${g.name} (${g.id})`)}
						}
					}
				}
			}
		const group = await adminApi(`groups/${state.groupId}.id,name`)	
		const groupUsers = await adminApi(`groups/${state.groupId}/users.id`)
		const isInGroup = groupUsers.some(gu=>gu.id===user.id)
		return {message:
			`🛈 You are '${user.display_name}' (ID ${user.id}) and `
			+`you ${isInGroup?"ARE":"ARE NOT"} a member of group '${group.name}' (ID ${group.id})`
			}
		}
	}
