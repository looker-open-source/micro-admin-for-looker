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

const defaultConsole = console

module.exports = function({
	console = defaultConsole
	}){
	return function(req,res,next){
		req.startTime = Date.now()
		req.id = Math.random().toString(16).slice(2,10)
		
		console.log(JSON.stringify({
			r:req.id,
			t:"Request Start",
			method:req.method,
			path:req.path
			}))


		innerJson = res.json
		res.json = function wrapJson(...args){
			if(typeof args[0] === "object"){
				res.jsonProps = Object.keys(args[0])
				}
			return innerJson.apply(res,args)
			}

		res.on('close',responseLogger)
		next()
		}
	}

function responseLogger(){
	const elapsed = Date.now() - this.req.startTime
	console.log(JSON.stringify({
		r: this.req.id,
		t:"Request End",
		code: this.statusCode,
		msec: elapsed,
		resProps: (this.jsonProps||[]).join(',') || undefined
		}))
	}