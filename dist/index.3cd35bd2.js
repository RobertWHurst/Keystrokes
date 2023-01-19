function e(e,t,s){return t in e?Object.defineProperty(e,t,{value:s,enumerable:!0,configurable:!0,writable:!0}):e[t]=s,e}class t{get isEmpty(){return!this._onPressed&&!this._onPressedWithRepeat&&!this._onReleased}isOwnHandler(e){return this._identity===e}executePressed(e){this._isPressed||this._onPressed?.(e),this._isPressed=!0,this._onPressedWithRepeat?.(e)}executeReleased(e){this._isPressed&&this._onReleased?.(e),this._isPressed=!1}constructor(e){this._isPressed=!1,this._identity=e,"function"==typeof e?this._onPressedWithRepeat=e:(this._onPressed=e.onPressed,this._onPressedWithRepeat=e.onPressedWithRepeat,this._onReleased=e.onReleased)}}class s{static parseKeyCombo(e){if(s._parseCache[e])return s._parseCache[e];const t=e.toLowerCase();let n="",i=[],o=[i],a=[o];const r=[a];let h=!1;for(let s=0;s<e.length;s+=1)"\\"===t[s]?h=!0:"+"!==t[s]&&">"!==t[s]&&","!==t[s]||h?t[s].match(/[^\s]/)&&(n&&(","===n?(i=[],o=[i],a=[o],r.push(a)):">"===n?(i=[],o=[i],a.push(o)):"+"===n&&(i=[],o.push(i)),n=""),h=!1,i.push(t[s])):n=t[s];const c=r.map((e=>e.map((e=>e.map((e=>e.join("")))))));return s._parseCache[e]=c,c}static stringifyKeyCombo(e){return e.map((e=>e.map((e=>e.map((e=>"+"===e?"\\+":">"===e?"\\>":","===e?"\\,":e)).join("+"))).join(">"))).join(",")}static normalizeKeyCombo(e){if(s._normalizationCache[e])return s._normalizationCache[e];const t=this.stringifyKeyCombo(this.parseKeyCombo(e));return s._normalizationCache[e]=t,t}get isPressed(){return!!this._isPressedWithFinalKey}isOwnHandler(e){return this._handlerState.isOwnHandler(e)}executePressed(e){this._isPressedWithFinalKey===e.key&&this._handlerState.executePressed(this._wrapEvent(e))}executeReleased(e){this._isPressedWithFinalKey===e.key&&(this._isPressedWithFinalKey="",this._handlerState.executeReleased(this._wrapEvent(e)))}updateState(e){const t=this._parsedKeyCombo[this._sequenceIndex];if(0===e.length)return;let s=0;for(const n of t){let t=s;for(const i of n){let n=!1;for(let o=s;o<e.length;o+=1){if(i===e[o]){o>t&&(t=o),n=!0;break}}if(!n)return void(this._handlerState.isEmpty&&(this._isPressedWithFinalKey=""))}s=t}for(const s of e){let e=!1;for(const n of t)for(const t of n)if(s===t){e=!0;break}if(!e)return void(this._sequenceIndex=0)}this._sequenceIndex<this._parsedKeyCombo.length-1?this._sequenceIndex+=1:(this._sequenceIndex=0,this._isPressedWithFinalKey=e[e.length-1])}_wrapEvent(e){return{keyCombo:this._normalizedKeyCombo,originalEvent:e.originalEvent}}constructor(e,n={}){this._normalizedKeyCombo=s.normalizeKeyCombo(e),this._parsedKeyCombo=s.parseKeyCombo(e),this._handlerState=new t(n),this._isPressedWithFinalKey="",this._sequenceIndex=0}}e(s,"_parseCache",{}),e(s,"_normalizationCache",{});const n="function"==typeof requestAnimationFrame?e=>requestAnimationFrame(e):e=>setTimeout(e,0),i=()=>new Promise((e=>n(e))),o=e=>{try{const t=()=>e();return addEventListener("focus",t),()=>{removeEventListener("focus",t)}}catch{}},a=e=>{try{const t=()=>e();return addEventListener("blur",t),()=>{removeEventListener("blur",t)}}catch{}},r=e=>{try{const t=t=>e({key:t.key,originalEvent:t});return document.addEventListener("keydown",t),()=>{document.removeEventListener("keydown",t)}}catch{}},h=e=>{try{const t=t=>e({key:t.key,originalEvent:t});return document.addEventListener("keyup",t),()=>{document.removeEventListener("keyup",t)}}catch{}};class c{get pressedKeys(){return this._activeKeys.slice(0)}bindKey(e,s){e=e.toLowerCase();const n=new t(s);this._handlerStates[e]??=[],this._handlerStates[e].push(n)}unbindKey(e,t){e=e.toLowerCase();const s=this._handlerStates[e];if(s)if(t)for(let e=0;e<s.length;e+=1)s[e].isOwnHandler(t)&&(s.splice(e,1),e-=1);else s.length=0}bindKeyCombo(e,t){e=s.normalizeKeyCombo(e);const n=new s(e,t);this._keyComboStates[e]??=[],this._keyComboStates[e].push(n),this._keyComboStatesArray.push(n)}unbindKeyCombo(e,t){e=s.normalizeKeyCombo(e);const n=this._keyComboStates[e];if(n)if(t){for(let e=0;e<n.length;e+=1)if(n[e].isOwnHandler(t)){for(let t=0;t<this._keyComboStatesArray.length;t+=1)this._keyComboStatesArray[t]===n[e]&&(this._keyComboStatesArray.splice(t,1),t-=1);n.splice(e,1),e-=1}}else n.length=0}checkKey(e){return this._activeKeySet.has(e.toLowerCase())}checkKeyCombo(e){e=s.normalizeKeyCombo(e),this._watchedKeyComboStates[e]||(this._watchedKeyComboStates[e]=new s(e));const t=this._watchedKeyComboStates[e];return t.updateState(this._activeKeys),t.isPressed}bindEnvironment(){this.unbindEnvironment();const e=this._onActiveBinder((()=>{this._isActive=!0})),t=this._onInactiveBinder((()=>{this._isActive=!1})),s=this._onKeyPressedBinder((e=>{this._handleKeyPress(e)})),n=this._onKeyReleasedBinder((e=>{this._handleKeyRelease(e)}));this._unbinder=()=>{e?.(),t?.(),s?.(),n?.()}}unbindEnvironment(){this._unbinder?.()}_handleKeyPress(e){(async()=>{if(!this._isActive)return;let t=e.key.toLowerCase();const s=this._keyRemap[t];s&&(t=s);const n=this._handlerStates[t];if(n)for(const t of n)t.executePressed(e);this._activeKeySet.has(t)||(this._activeKeySet.add(t),this._activeKeys.push(t)),await this._updateKeyComboStates();for(const t of this._keyComboStatesArray)t.executePressed(e)})().catch((e=>{console.error(e)}))}_handleKeyRelease(e){(async()=>{const t=e.key.toLowerCase(),s=this._handlerStates[t];if(s)for(const t of s)t.executeReleased(e);if(this._activeKeySet.has(t)){this._activeKeySet.delete(t);for(let e=0;e<this._activeKeys.length;e+=1)if(this._activeKeys[e]===t){this._activeKeys.splice(e,1),e-=1;break}}this._tryReleaseSelfReleasingKeys(),await this._updateKeyComboStates();for(const t of this._keyComboStatesArray)t.executeReleased(e)})().catch((e=>{console.error(e)}))}async _updateKeyComboStates(){if(this._isUpdatingKeyComboState)return await i();this._isUpdatingKeyComboState=!0,await i();for(const e of this._keyComboStatesArray)e.updateState(this._activeKeys);this._isUpdatingKeyComboState=!1}_tryReleaseSelfReleasingKeys(){for(const e of this._activeKeys){let t=!1;for(const s of this._selfReleasingKeys)if(e===s){t=!0;break}if(!t)return}for(const e of this._activeKeys)this._handleKeyRelease({key:e})}constructor(e={}){this._isActive=!0,this._isUpdatingKeyComboState=!1,this._onActiveBinder=e.onActive??o,this._onInactiveBinder=e.onInactive??a,this._onKeyPressedBinder=e.onKeyPressed??r,this._onKeyReleasedBinder=e.onKeyReleased??h,this._selfReleasingKeys=e.selfReleasingKeys??[],this._keyRemap=e.keyRemap??{},this._handlerStates={},this._keyComboStates={},this._keyComboStatesArray=[],this._activeKeys=[],this._activeKeySet=new Set,this._watchedKeyComboStates={},this.bindEnvironment()}}s.normalizeKeyCombo;const d=s.stringifyKeyCombo,y=s.parseKeyCombo;function l(e,t,s){let n=e.map((e=>`<span class="sequence">${e.map((e=>`<span class="unit">${e.map((e=>`<span class="key${t.includes(e)?" pressed":""}">${e}</span>`)).join('<span class="join"> + </span>')}</span>`)).join('<span class="order"> &gt; </span>')}</span>`)).join('<span class="group">, </span>');switch(s){case"+":n+='<span class="join"> + </span>';break;case">":n+='<span class="order"> &gt; </span>';break;case",":n+='<span class="group">, </span>'}return n}(async function(){const e=new c;let t="";const s=y("a > b, c + b"),n=document.querySelector("#key-combo");n.innerHTML=l(s,e.pressedKeys);const i=n.style.background,o={onPressed(){n.style.background="#FFBF00"},onReleased(){n.style.background=i}},a=()=>{e.unbindKeyCombo(t,o),t=d(s),e.bindKeyCombo(t,o)};a();let r=!0,h="";document.addEventListener("keydown",(()=>{n.innerHTML=l(s,e.pressedKeys)})),document.addEventListener("keyup",(()=>{n.innerHTML=l(s,e.pressedKeys)})),n.addEventListener("keydown",(e=>{"shift"===e.key.toLowerCase()&&(r=!0),console.log("down",r)})),n.addEventListener("keyup",(t=>{t.preventDefault(),t.stopImmediatePropagation();const i=t.key.toLowerCase();let o=s[s.length-1],c=o?.[o.length-1]??[];"shift"!==i&&(r=!1),"backspace"===i&&h?h="":"backspace"===i&&0!==c.length?(c.pop(),h="+",0===c.length&&(o.pop(),h=">"),0===o.length&&(s.pop(),h=","),0===s.length&&(h="")):"enter"===i?n.blur():"+"===i||">"===i||","===i?h=i:h&&("shift"!==i||r)?("+"===h?(o||(o=[],s.push(o)),c||(c=[],o.push(c)),c.push(i)):">"===h?(c=[i],o||(o=[],s.push(o)),o.push(c)):","===h&&(o=[[i]],s.push(o)),h=""):("shift"!==i||r)&&(o||(o=[],s.push(o)),c||(c=[],o.push(c)),c.pop(),c.push(i)),n.innerHTML=l(s,e.pressedKeys,h),a()}))})().catch((e=>{console.error(e)}));
//# sourceMappingURL=index.3cd35bd2.js.map
