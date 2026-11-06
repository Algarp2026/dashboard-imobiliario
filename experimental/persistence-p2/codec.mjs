// P2 laboratory modules. No initialization, storage access or production imports.
export function fail(code){throw Object.assign(new Error(code),{code});}
export const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export const sha=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
export const utf8=value=>new TextEncoder().encode(value);
export function utf16(value){const bytes=new Uint8Array(value.length*2);for(let i=0;i<value.length;i++){const n=value.charCodeAt(i);bytes[i*2]=n&255;bytes[i*2+1]=n>>>8;}return bytes;}
export function fromUtf16(bytes){if(bytes.length%2)fail('P2_ODD_UTF16');let s='';for(let i=0;i<bytes.length;i+=8192){const part=[];for(let j=i;j<Math.min(i+8192,bytes.length);j+=2)part.push(bytes[j]|bytes[j+1]<<8);s+=String.fromCharCode(...part);}return s;}
export function canonical(value,depth=0){
  if(depth>40)fail('P2_JSON_DEPTH');
  if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
  if(Array.isArray(value)){if(Object.keys(value).length!==value.length)fail('P2_SPARSE_JSON');return '['+value.map(x=>canonical(x,depth+1)).join(',')+']';}
  if(object(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value)))return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k],depth+1)).join(',')+'}';
  fail('P2_NON_JSON_VALUE');
}
export const commercialHash=value=>sha(utf8(canonical(value)));
export const legacyTextHash=value=>sha(utf8(value));

// Tagged graph preserves structured-clone values, cycles, key order and lone surrogates.
async function encodeGraph(root){
  const seen=new Map(),nodes=[];
  async function token(v,depth=0){
    if(depth>128)fail('P2_GRAPH_DEPTH');
    if(v===null)return ['null'];
    if(typeof v==='string'||typeof v==='boolean')return [typeof v,v];
    if(typeof v==='number')return ['number',Object.is(v,-0)?'-0':Number.isNaN(v)?'NaN':String(v)];
    if(v===undefined)return ['undefined'];if(typeof v==='bigint')return ['bigint',String(v)];
    if(typeof v!=='object')fail('P2_UNSUPPORTED_CLONE');
    if(seen.has(v))return ['ref',seen.get(v)];
    if(nodes.length>=100000)fail('P2_GRAPH_LIMIT');
    const plain=Array.isArray(v)||[Object.prototype,null].includes(Object.getPrototypeOf(v));
    const nativeSymbols=typeof File!=='undefined'&&v instanceof File?Object.getOwnPropertySymbols(new File([],'')):typeof Blob!=='undefined'&&v instanceof Blob?Object.getOwnPropertySymbols(new Blob()):[];
    if(!plain&&(Object.keys(v).some(k=>!ArrayBuffer.isView(v)||v instanceof DataView||!/^\d+$/.test(k)||Number(k)>=v.length)||Object.getOwnPropertySymbols(v).some(k=>!nativeSymbols.includes(k)&&Object.getOwnPropertyDescriptor(v,k)?.enumerable)))fail('P2_UNSUPPORTED_CLONE_PROPERTIES');
    const id=nodes.length;seen.set(v,id);nodes.push(null);let node;
    if(v instanceof ArrayBuffer)node={type:'buffer',bytes:Array.from(new Uint8Array(v))};
    else if(ArrayBuffer.isView(v))node={type:'view',name:v.constructor.name,buffer:await token(v.buffer,depth+1),offset:v.byteOffset,length:v instanceof DataView?v.byteLength:v.length};
    else if(v instanceof Date)node={type:'date',time:String(v.getTime())};
    else if(v instanceof RegExp)node={type:'regexp',source:v.source,flags:v.flags,lastIndex:v.lastIndex};
    else if(v instanceof Map){node={type:'map',entries:[]};for(const [k,x]of v)node.entries.push([await token(k,depth+1),await token(x,depth+1)]);}
    else if(v instanceof Set){node={type:'set',values:[]};for(const x of v)node.values.push(await token(x,depth+1));}
    else if(typeof File!=='undefined'&&v instanceof File)node={type:'file',mime:v.type,name:v.name,lastModified:v.lastModified,bytes:Array.from(new Uint8Array(await v.arrayBuffer()))};
    else if(typeof Blob!=='undefined'&&v instanceof Blob)node={type:'blob',mime:v.type,bytes:Array.from(new Uint8Array(await v.arrayBuffer()))};
    else{
      const proto=Object.getPrototypeOf(v);if(!Array.isArray(v)&&![Object.prototype,null].includes(proto))fail('P2_UNSUPPORTED_CLONE');
      node={type:Array.isArray(v)?'array':'object',nullPrototype:proto===null,length:Array.isArray(v)?v.length:undefined,entries:[]};
      for(const key of Reflect.ownKeys(v)){
        if(Array.isArray(v)&&key==='length')continue;if(typeof key!=='string')fail('P2_UNSUPPORTED_CLONE');
        const d=Object.getOwnPropertyDescriptor(v,key);if(d.get||d.set)fail('P2_ACCESSOR_REJECTED');if(!d.enumerable)fail('P2_UNSUPPORTED_DESCRIPTOR');node.entries.push([key,await token(d.value,depth+1)]);
      }
    }
    nodes[id]=node;return ['ref',id];
  }
  const reference=await token(root);return {format:1,root:reference,nodes};
}
function decodeGraph(graph){
  if(graph?.format!==1||!Array.isArray(graph.nodes)||graph.nodes.length>100000)fail('P2_INVALID_GRAPH');
  const values=new Map(),constructing=new Set();
  const typed={Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,DataView,...(typeof BigInt64Array!=='undefined'?{BigInt64Array,BigUint64Array}:{})};
  const binary=bytes=>{if(!Array.isArray(bytes)||bytes.some(x=>!Number.isInteger(x)||x<0||x>255))fail('P2_INVALID_GRAPH');return Uint8Array.from(bytes);};
  function read(t){
    if(!Array.isArray(t))fail('P2_INVALID_GRAPH');const [type,value]=t;
    if(type==='null')return null;if(type==='undefined')return undefined;
    if(type==='string'&&typeof value==='string'||type==='boolean'&&typeof value==='boolean')return value;
    if(type==='number'&&typeof value==='string')return Number(value);if(type==='bigint')return BigInt(value);
    if(type!=='ref'||!Number.isSafeInteger(value)||value<0||value>=graph.nodes.length)fail('P2_MISSING_GRAPH_REFERENCE');
    if(values.has(value))return values.get(value);if(constructing.has(value))fail('P2_INVALID_GRAPH_CYCLE');
    constructing.add(value);const n=graph.nodes[value];let out;
    if(!object(n))fail('P2_INVALID_GRAPH');
    if(n.type==='buffer')out=binary(n.bytes).buffer;
    else if(n.type==='view'){if(!Object.hasOwn(typed,n.name))fail('P2_INVALID_GRAPH');out=new typed[n.name](read(n.buffer),n.offset,n.length);}
    else if(n.type==='date')out=new Date(Number(n.time));
    else if(n.type==='regexp'){out=new RegExp(n.source,n.flags);out.lastIndex=n.lastIndex;}
    else if(n.type==='blob')out=new Blob([binary(n.bytes)],{type:n.mime});
    else if(n.type==='file'){if(typeof File==='undefined')fail('P2_FILE_UNAVAILABLE');out=new File([binary(n.bytes)],n.name,{type:n.mime,lastModified:n.lastModified});}
    else if(n.type==='array'){if(!Number.isSafeInteger(n.length)||n.length<0||n.length>10000000)fail('P2_INVALID_GRAPH');out=new Array(n.length);}
    else if(n.type==='object')out=n.nullPrototype?Object.create(null):{};
    else if(n.type==='map')out=new Map();else if(n.type==='set')out=new Set();else fail('P2_INVALID_GRAPH');
    values.set(value,out);
    if(['object','array'].includes(n.type)){if(!Array.isArray(n.entries))fail('P2_INVALID_GRAPH');for(const [k,t]of n.entries){if(typeof k!=='string'||Array.isArray(out)&&k==='length'||Object.hasOwn(out,k))fail('P2_INVALID_GRAPH');Object.defineProperty(out,k,{value:read(t),enumerable:true,writable:true,configurable:true});}}
    if(n.type==='map')for(const [k,v]of n.entries)out.set(read(k),read(v));
    if(n.type==='set')for(const v of n.values)out.add(read(v));
    constructing.delete(value);return out;
  }
  return read(graph.root);
}
export async function encodeOriginal(value){
  const text=typeof value==='string',bytes=text?utf16(value):utf8(JSON.stringify(await encodeGraph(value))),rawHash=await sha(bytes);
  return {version:1,bodyRef:'b1:'+(text?'u16:':'graph:')+rawHash,rawHash,codec:'identity',mediaType:text?'text/x-utf16le-codeunits':'application/x-structured-clone-graph-v1',decodedBytes:bytes.length,encodedBytes:bytes.length,bytes};
}
export async function decodeOriginal(body){
  const expected=['version','bodyRef','rawHash','codec','mediaType','decodedBytes','encodedBytes','bytes'];
  if(!body||Object.keys(body).length!==expected.length||!expected.every(k=>Object.hasOwn(body,k))||body.version!==1||body.codec!=='identity'||!(body.bytes instanceof Uint8Array)||body.encodedBytes!==body.bytes.length||body.decodedBytes!==body.bytes.length||body.bodyRef!=='b1:'+(body.mediaType==='text/x-utf16le-codeunits'?'u16:':'graph:')+body.rawHash||await sha(body.bytes)!==body.rawHash)fail('P2_BODY_INTEGRITY');
  if(body.mediaType==='text/x-utf16le-codeunits')return fromUtf16(body.bytes);
  if(body.mediaType==='application/x-structured-clone-graph-v1'){
    const value=decodeGraph(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(body.bytes)));
    if((await encodeOriginal(value)).bodyRef!==body.bodyRef)fail('P2_NONCANONICAL_GRAPH');
    return value;
  }
  fail('P2_UNKNOWN_BODY_FORMAT');
}
