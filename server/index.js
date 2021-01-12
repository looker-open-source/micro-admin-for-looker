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

const fs = require('fs')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')


const expressRequestLogger = require('./lib/express-middleware/request-logger.js')
const routeHandlers = require('./route-handlers')
const configLoader = require(`./lib/config-loader.js`)
const setupHost = require('./lib/setup-host.js')

const config = configLoader(require('./config.json'))
// const hosts = config.hosts
const primaryHostId = config.primaryHostId

//Check for Env variables if being deployed via cloud run
if(process.env.PORT) {
    config.port = process.env.PORT
}
if(process.env.PRIMARYHOSTID) {
	config.primaryHostId = process.env.PRIMARYHOSTID
}
const apiHost = config.primaryHostId + ':19999'
if(process.env.APIHOST) {
	const apiHost = process.env.apiHost
}


const hosts = {
	[config.primaryHostId]: {
	  "apiHost": apiHost,
	  "id": 1,
	  "uiHost": primaryHostId,
	  "admin_credentials": {
		  "client_id": process.env.CLIENT_ID,
		  "client_secret": process.env.CLIENT_SECRET
	  },
	  "forceOauthClientConfig": false
	}
}


main().catch(console.error)

async function main(){

	console.log(`Checking Looker hosts...`)
	const asyncAllSetupHosts = Object.values(hosts).map(async host=>{
		await setupHost(config,host)
		console.log(`> Looker host ${host.id} ok`)
		})
	await Promise.all(asyncAllSetupHosts)

	console.log("Starting http server...")
	await initServer()
	console.log(`> http://localhost:${config.port}/`)
	}

async function initServer(){
	const flows = Object.fromEntries(
		Object.entries(config.flows)
		.filter(([flowId,config]) => !config.disabled)
		.map(([flowId,config]) => {
			try{
				return [flowId, {
					...require(path.resolve(__dirname,'./flows/', config.src || flowId + '.js')),
					...config,
					id:flowId
					}]
				}
			catch(e){console.error(e)}
			})
		.filter(Boolean)
		)

	const app = express()

	app.use(express.static('static',{index:"index.xhtml",maxAge:15000}))
	app.use('/api',expressRequestLogger({console}))
	app.use('/api',bodyParser.json())
	app.get ('/api/hosts',routeHandlers.hosts({hosts,primaryHostId}))
	app.get ('/api/flows',routeHandlers.flows({flows}))
	app.post('/api/flow/:flow/execute', routeHandlers.flowExecute({hosts,flows,primaryHostId}))

	app.use(function (err, req, res, next) {
		res.status(err.status||500).json(err.message||err)
		})

	app.listen(config.port)
	}