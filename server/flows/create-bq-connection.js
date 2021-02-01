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

		if(!state.connectionName){ok=false}
		if(!state.database){ok=false}
		if(!state.certificateUpload){ok=false}
		if(!ok){
			return {
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
					certificateUpload:{
						type: "string",
						title: "Certificate",
						required: true,
						media: {
							type:"application/json",
							binaryEncoding: "base64"
							}
						}
					}
				}
			}

		const base64EncodedCertificate = state.certificateUpload.replace(/^data:.*?base64,/,'')
		const certificateJson = Buffer.from(base64EncodedCertificate,'base64').toString('utf8')
		const certificate = JSON.parse(certificateJson)

		const username = certificate.client_email
		const dbHost = certificate.project_id

		if(!username){return {message:"Invalid certificate: Missing client_email"}}
		if(!dbHost){return {message:"Invalid certificate: Missing project_id"}}

		// May want to fetch existing connections and check for conflicts/duplicates?

		await adminApi("POST connections",{body:{
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

		}
	}