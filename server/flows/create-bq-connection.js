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


connectionJSON="{ \"name\":\"$connection_name\", \"host\":\"$host\", \"database\":\"$database\", \"db_timezone\":\"$db_timezone\", \"query_timezone\":\"$query_timezone\", \"tmp_db_name\":\"$tmp_db_name\", \"dialect_name\":\"$dialect_name\", \"pdts_enabled\":$pdts_enabled, \"uses_oauth\":$uses_oauth, \"username\":\"$username\", \"certificate\":\"$certificate\", \"file_type\":\"$file_type\" }"

file_type=".json"


module.exports = {
	label: "Create a new BQ Connection",
	handler: async function({state,host,log}){
		
		const {user, adminApi} = host
		
		let ok = true
		// if(!state.userId){
		// 	log("User to disable not provided.")
		// 	log("Retreiving user list for prompt")
		// 	const allUsers = await adminApi(`users.id,display_name,email,avatar_url,is_disabled`)
		// 	const disableCandidates = allUsers.filter(u =>
		// 		! u.is_disabled // Hide already disabled users
		// 		&& u.id !== user.id // Don't suggest our user to disable themselves, for safety
		// 		)
		// 		.sort((a,b)=>(a.display_name||'').localeCompare(b.display_name||''))
		// 	log(`Returning list of ${disableCandidates.length} users for prompt`)

		// 	}
		if(!state.connectionName){ok=false}
		//if(!state.host){ok=false}
		if(!state.database){ok=false}
		//if(!state.username){ok=false}
		if(!state.certificate){ok=false}
		if(!ok){
			return {
				message:"this param is missing...",
				prompt: {
					connectionName: {
						type: "string",
						required:true
						},
					// host: { // This is the project name, which is already defined in the certificate json
					// 	type: "string",
					// 	required:true
					// 	},
					database: {
						type: "string",
						title: "Default Dataset",
						required:true
						},
					pdtsEnabled: {
						type: "boolean"
					},
					// username:{
					// 	type: "string",
					// 	required: true
					// 	},
					certificate:{
						type: "string",
						required: true
						}
					}
				}
			}
		// TODO fetch existing connections and check for conflicts?
		const certificate = JSON.parse(state.certificate)
		const base64EncodedCertificate = Buffer.from(state.certificate).toString('base64')
		const username = certificate.client_email
		const dbHost = certificate.project_id

		await
		//console.log(
		 adminApi("POST connections",{body:{
			name:state.connectionName,
			host:dbHost,
			database:state.database,
			db_timezone: state.dbTimezone,
			query_timezone: state.queryTimezone,
			"tmp_db_name": state.tempDbName,
			"dialect_name":"bigquery_standard_sql",
			"pdts_enabled": state.pdtsEnabled,
			"uses_oauth": false,
			"username":username,
			"certificate":base64EncodedCertificate,
			"file_type":".json" 
			}})
		//)

		}
	}