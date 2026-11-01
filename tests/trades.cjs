const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname, '..', 'the-collection.html'),'utf8');const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const fields={};const document={addEventListener(){},getElementById(id){return fields[id]||(fields[id]={value:'',innerHTML:''})}};
const ctx=vm.createContext({document,console,URLSearchParams,window:{addEventListener(){},location:{search:''}},location:{search:''},localStorage:{getItem(){return null}},setTimeout(){},clearTimeout(){}});vm.runInContext(script,ctx);
vm.runInContext(`
function check(v,m){if(!v)throw Error(m)}
function set(k,v){document.getElementById('f-trade-'+k).value=String(v)}
function defaults(){set('state','pending');set('incoming','b');set('date','2026-11-01');set('added',0);set('received',0);set('fees',0);set('value','');set('notes','Even trade')}
items=[{id:'a',name:'Mott',status:'stash',cost:300,images:['original.jpg']},{id:'b',name:'Empire',status:'wishlist'}];defaults();
let data={...items[0]};check(prepareTrade('a',data)===null,'pending');Object.assign(items[0],data);check(items[1].status==='wishlist','pending not owned');
let rejected=false;try{prepareTrade('b',{...items[1],status:'stash'})}catch(e){rejected=true}check(rejected,'reserved incoming protected');
set('state','completed');data={...items[0]};let apply=prepareTrade('a',data);Object.assign(items[0],data);apply();
check(items[0].status==='traded'&&items[1].status==='stash','completed statuses');check(items[1].cost===300,'carried cost');check(items[0].images[0]==='original.jpg'&&items[0].cost===300,'history');check(items[0].trade.cashAdded===0,'even trade');check(tabOf('traded')==='trades','tab');
check(JSON.parse(JSON.stringify(items))[0].trade.incomingId==='b','JSON persistence');currentTab='trades';renderStats([items[0]]);check(!document.getElementById('stats-row').innerHTML.includes('revenue'),'not sale revenue');check(tradeSummary(items[1]).includes('from Mott'),'incoming history');
items=[{id:'a',name:'Outgoing',status:'stash',cost:null},{id:'b',name:'Incoming',status:'wishlist'}];defaults();set('state','completed');set('added',50);set('fees',12);data={...items[0]};prepareTrade('a',data);check(data.trade.incomingCostUSD===null,'unknown cost');
data={...items[0],cost:200,costCurrency:'EUR',costUSD:220};prepareTrade('a',data);check(data.trade.incomingCostUSD===282,'foreign cost');set('received',20);data={...items[0],cost:100};prepareTrade('a',data);check(data.trade.incomingCostUSD===142,'cash received');
set('added',-1);rejected=false;try{prepareTrade('a',data)}catch(e){rejected=true}check(rejected,'negative rejected');
items[0].trade={id:'t',status:'pending',incomingId:'b'};set('state','cancelled');data={...items[0]};prepareTrade('a',data);check(data.trade.status==='cancelled','cancellation');
console.log('12 trade logic checks passed');
`,ctx);
