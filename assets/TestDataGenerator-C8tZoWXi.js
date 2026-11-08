import{r as b,j as t,C as F,a as P,_ as D}from"./index-DBLtWpQf.js";import{c as I}from"./clipboard-4AVuv3jI.js";import{T as U}from"./ToolCard-ChFuDJXH.js";import{b as _}from"./csv-BlmvqBbq.js";const y=n=>"'"+n.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/\t/g,"\\t")+"'",j=(n,l=0)=>{const u="    ".repeat(l+1),h="    ".repeat(l);if(n==null)return"None";if(typeof n=="boolean")return n?"True":"False";if(typeof n=="number")return Number.isNaN(n)?'float("nan")':Number.isFinite(n)?String(n):n>0?'float("inf")':'float("-inf")';if(typeof n=="string")return y(n);if(Array.isArray(n))return n.length===0?"[]":`[
`+n.map(c=>u+j(c,l+1)).join(`,
`)+`
`+h+"]";if(typeof n=="object"){const c=Object.entries(n);return c.length===0?"{}":`{
`+c.map(([f,d])=>`${u}${y(f)}: ${j(d,l+1)}`).join(`,
`)+`
`+h+"}"}return y(String(n))},A={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},x=n=>String(n??"").replace(/[&<>"']/g,l=>A[l]),V=[{id:1,name:"id",type:"RowNumber"},{id:2,name:"name",type:"FullName"},{id:3,name:"email",type:"Email"}],H=["RowNumber","UUID","FullName","FirstName","LastName","Email","PhoneNumber","City","Country","RandomNumber","RandomWords"],W=()=>{const[n,l]=b.useState(V),[u,h]=b.useState(10),[c,f]=b.useState("JSON"),[d,m]=b.useState(""),[S,N]=b.useState(!1),C=()=>{var o;const e=(((o=n[n.length-1])==null?void 0:o.id)||0)+1;l([...n,{id:e,name:`column${e}`,type:"RandomWords"}])},v=e=>{l(n.filter(o=>o.id!==e))},w=(e,o,s)=>{l(n.map(i=>i.id===e?{...i,[o]:s}:i))},k=async()=>{const{faker:e}=await D(async()=>{const{faker:i}=await import("./index-scQ6lXBA.js");return{faker:i}},[]),o=[],s=Math.min(1e3,Math.max(1,u||1));for(let i=1;i<=s;i++){const a={};for(const r of n)switch(r.type){case"RowNumber":a[r.name]=i;break;case"UUID":a[r.name]=e.string.uuid();break;case"FullName":a[r.name]=e.person.fullName();break;case"FirstName":a[r.name]=e.person.firstName();break;case"LastName":a[r.name]=e.person.lastName();break;case"Email":a[r.name]=e.internet.email();break;case"PhoneNumber":a[r.name]=e.phone.number();break;case"City":a[r.name]=e.location.city();break;case"Country":a[r.name]=e.location.country();break;case"RandomNumber":a[r.name]=e.number.int({min:1,max:1e3});break;case"RandomWords":a[r.name]=e.lorem.words(3);break}o.push(a)}return o},T=e=>`<?xml version="1.0" encoding="UTF-8"?>
<data>
${e.map(s=>`  <row>
${Object.entries(s).map(([a,r])=>`    <${x(a)}>${x(r)}</${x(a)}>`).join(`
`)}
  </row>`).join(`
`)}
</data>`,L=e=>{const o=Object.keys(e[0]||{}),s=o.map(a=>`    <th>${x(a)}</th>`).join(`
`),i=e.map(a=>`  <tr>
${o.map(p=>`    <td>${x(a[p])}</td>`).join(`
`)}
  </tr>`).join(`
`);return`<!DOCTYPE html>
<html>
<head>
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <table>
    <tr>
${s}
    </tr>
${i}
  </table>
</body>
</html>`},$=e=>{if(e.length===0)return"";const o="generated_data",s=Object.keys(e[0]),i=`CREATE TABLE ${o} (
  ${s.map(r=>`${r} ${typeof e[0][r]=="number"?"INTEGER":"VARCHAR(255)"}`).join(`,
  `)}
);

`,a=e.map(r=>{const p=Object.values(r).map(g=>typeof g=="string"?`'${g.replace(/'/g,"''")}'`:g).join(", ");return`INSERT INTO ${o} (${s.join(", ")}) VALUES (${p});`}).join(`
`);return i+a},O=e=>`data = ${j(e)}`,R=e=>`const data = ${JSON.stringify(e,null,2)};`,E=async()=>{const e=await k();switch(c){case"JSON":m(JSON.stringify(e,null,2));break;case"CSV":m(_(e));break;case"XML":m(T(e));break;case"HTML":m(L(e));break;case"SQL":m($(e));break;case"Python":m(O(e));break;case"JavaScript":m(R(e));break}},M=()=>{d&&I(d).then(e=>{e&&(N(!0),setTimeout(()=>N(!1),2e3))})},J=()=>{if(!d)return;const o={JSON:".json",CSV:".csv",XML:".xml",HTML:".html",SQL:".sql",Python:".py",JavaScript:".js"}[c],i={JSON:"application/json",CSV:"text/csv",XML:"application/xml",HTML:"text/html",SQL:"text/plain",Python:"text/x-python",JavaScript:"application/javascript"}[c],a=new Blob([d],{type:i}),r=URL.createObjectURL(a),p=document.createElement("a");p.href=r,p.download=`test_data${o}`,p.click(),URL.revokeObjectURL(r)};return t.jsxs(U,{title:"Test Data Generator",description:"Define your data structure, and generate realistic test data as JSON, CSV, XML, HTML, SQL, Python or JavaScript.",children:[t.jsxs("div",{className:"bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6",children:[t.jsx("h3",{className:"font-semibold text-lg text-white mb-4",children:"Configuration"}),t.jsxs("div",{className:"flex flex-wrap items-center gap-6",children:[t.jsxs("div",{children:[t.jsx("label",{className:"block text-sm font-medium text-slate-400 mb-1",children:"Number of Rows"}),t.jsx("input",{type:"number",value:u,onChange:e=>h(Number.parseInt(e.target.value,10)||0),min:"1",max:"1000",className:"w-32 bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white"})]}),t.jsxs("div",{children:[t.jsx("label",{className:"block text-sm font-medium text-slate-400 mb-1",children:"Output Format"}),t.jsxs("select",{value:c,onChange:e=>f(e.target.value),className:"w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white",children:[t.jsx("option",{value:"JSON",children:"JSON"}),t.jsx("option",{value:"CSV",children:"CSV"}),t.jsx("option",{value:"XML",children:"XML"}),t.jsx("option",{value:"HTML",children:"HTML"}),t.jsx("option",{value:"SQL",children:"SQL"}),t.jsx("option",{value:"Python",children:"Python"}),t.jsx("option",{value:"JavaScript",children:"JavaScript"})]})]})]})]}),t.jsxs("div",{className:"space-y-3 mb-6",children:[t.jsx("h3",{className:"font-semibold text-lg text-white",children:"Column Definitions"}),n.map((e,o)=>t.jsxs("div",{className:"flex flex-wrap items-center gap-3 bg-slate-800/60 p-3 rounded-md border border-slate-700",children:[t.jsx("input",{type:"text",value:e.name,onChange:s=>w(e.id,"name",s.target.value),placeholder:"Column Name",className:"flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white"}),t.jsx("select",{value:e.type,onChange:s=>w(e.id,"type",s.target.value),className:"flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white",children:H.map(s=>t.jsx("option",{value:s,children:s},s))}),t.jsx("button",{onClick:()=>v(e.id),className:"bg-red-600 hover:bg-red-500 text-white font-bold py-1.5 px-3 rounded-md text-sm",children:"Remove"})]},e.id)),t.jsx("button",{onClick:C,className:"bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200",children:"Add Column"})]}),t.jsxs("div",{className:"mt-6 flex flex-wrap items-center gap-4",children:[t.jsx("button",{onClick:E,className:"bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200",children:"Generate Data"}),d&&t.jsx(t.Fragment,{children:t.jsx("button",{onClick:J,className:"bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200",children:"Download"})})]}),t.jsxs("div",{className:"relative mt-4",children:[t.jsx("textarea",{value:d,readOnly:!0,className:"w-full h-80 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm font-mono",placeholder:"-- Generated data will appear here --"}),d&&t.jsx("button",{onClick:M,className:"absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-md transition-colors duration-200 z-10",title:"Copy to clipboard",children:S?t.jsx(F,{}):t.jsx(P,{})})]})]})};export{W as default};
