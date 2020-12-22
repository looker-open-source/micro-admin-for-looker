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
	label: "Measure Timings",
	description: "Times a bunch of API endpoints (Note: takes a long time to complete running)",
	handler: async function({state,host,log}){
		const {adminApi} = host

		//Warm-up call to ensure API is authed
		await adminApi(`GET user`)

		const data = []

		data.push(await repeatedMeasure(`GET users.id,email,display_name`))
		data.push(await repeatedMeasure(`GET users`))

		return {data,message: data.map(d=>`${d.rest.toString().slice(0,5).padStart(5,' ')}\t${d.endpoint}`).join('\n')}


		async function repeatedMeasure(endpoint, options){
			let n = 4
			let timings = []
			let lengths = []
			let errors = []
			for(let i=0; i<n; i++ ){
				let start = Date.now()
				try{
					let res = await adminApi(endpoint,options)
					timings.push((Date.now()-start)/1000)
					lengths.push(res && res.length)
					}
				catch(e){
					errors.push((Date.now()-start)/1000)
					}
				}
			const min = timings.reduce(minFn,Infinity)
			const max = timings.reduce(maxFn,-Infinity)
			const sum = timings.reduce(sumFn,0)
			const avg = timings.length>0 && sum / timings.length
			const first = timings[0]
			const restSum = timings.slice(1).reduce(sumFn,0)
			const rest = timings.length>1 && restSum / (timings.length-1)
			const errN = errors.length || undefined
			const errSum = errors.reduce(sumFn,0)
			const err = errN ? errSum/errN : undefined
			const len = lengths.filter(Boolean).filter(unique).join(",") || undefined
			const result = {endpoint, n, first, rest, errN, err, avg, min, max, len}
			log(result)
			return result
			}
		}
	}
function minFn(a,b){return Math.min(a,b)}
function maxFn(a,b){return Math.max(a,b)}
function sumFn(a,b){return a+b}
function unique(x,i,arr){return arr.indexOf(x)===i}