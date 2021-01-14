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
const hosts = config.hosts
const primaryHostId = config.primaryHostId

main().catch(console.error)

async function main(){

	const asyncAllSetupHosts = Object.values(hosts).map(async host=>{
		await setupHost(config,host)
		})
	await Promise.all(asyncAllSetupHosts)

	await initServer()
	console.log(`\nhttp://localhost:${config.port}/`)
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