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

export function offon(off,on){
	off && (off.style ? [off] : $$(off)).forEach(el=>el.style.display="none")
	on  && (on.style  ? [on]  : $$(on )).forEach(el=>el.style.display="block")
	}
export function $ (selector, el) {return (el||document).querySelector(selector)}
export function $$ (selector, el) {return (el||document).querySelectorAll(selector)}
export function tryJsonParse(str,dft){
	try{return JSON.parse(str)}
	catch(e){return dft}
	}
export function urlDecodeObj(str,from){
		return (from?str.slice(1+str.indexOf(from)):str)
			.split('&')
			.map(pair=>pair.split('=').map(decodeURIComponent))
			.reduce((o,[k,...v])=>({...o, [k]:(v||'').join('=')}),{})
		}
export function message(str){
	const strArr = Array.from(str) //Handle unicode correctly
	const hasIcon = strArr[0] && !strArr[0].match(/\w/) 
	const icon = hasIcon ? strArr[0] : ""
	const text = hasIcon ? strArr.slice(1).join('') : str
	const className = {
		"🛈":"info",
		"✅":"ok",
		"⚠":"warn",
		"❌":"err"
		}[icon]||""
	
	$("#msg-icon").textContent = icon
	$("#msg-text").textContent = text
	const bar = $("#msg-bar")
	bar.className = className
	offon("#throbber",bar)
	}