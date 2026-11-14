import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import vm from 'node:vm';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(join(root,path),'utf8');
const catalog = JSON.parse(read('data/catalog.json'));
const html = read('dist/index.html');
const langJSON = html.match(/<script id="translations" type="application\/json">([\s\S]*?)<\/script>/)[1];

class Element {
  constructor(tagName) {
    this.tagName=tagName.toUpperCase(); this.children=[]; this._text=''; this.events={}; this.attributes={};
    this.hidden=false; this.className=''; this.value=''; this.disabled=false;
    this.classList={toggle:(part,on)=>{
      const current=new Set(this.className.split(/\s+/).filter(Boolean));
      if(on)current.add(part);else current.delete(part);
      this.className=[...current].join(' ');
    }};
  }
  get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
  set textContent(value){this._text=String(value);this.children=[];}
  append(...children) { for(const child of children){ if(child.tagName==='#FRAGMENT')this.children.push(...child.children);else this.children.push(child); } }
  replaceChildren(...children){this.children=[];this._text='';this.append(...children);}
  addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
  setAttribute(k,v){this.attributes[k]=String(v)}
  getAttribute(k){return this.attributes[k]}
  async dispatch(event){for(const fn of this.events[event]||[])await fn({preventDefault(){}})}
  select(){this.selected=true}
  remove(){this.removed=true}
  focus(){this.focused=true}
}
function findNodes(root,predicate){
  const found=[];const scan=el=>{if(predicate(el))found.push(el);for(const child of el.children)scan(child)};
  scan(root);return found;
}
async function runUI(){
  const ids = new Map(['repository-list','result-count','filters','search','sort','toast','translations'].map(id => [id,new Element(id)]));
  ids.get('translations').textContent=langJSON;
  ids.get('sort').value='available';
  const document={
    getElementById:id=>ids.get(id),createElement:tag=>new Element(tag),createDocumentFragment:()=>new Element('#FRAGMENT'),
    body:new Element('body'),activeElement:null,events:{},addEventListener(name,fn){(this.events[name]??=[]).push(fn)},execCommand(name){return name==='copy'}
  };
  let copied;
  const clipboard={writeText:async value=>{copied=value}};
  const sandbox={document,navigator:{clipboard},window:{setTimeout(){}},fetch:async url=>{
    assert.equal(url,'/catalog.json');return {ok:true,json:async()=>catalog};
  }, console:{warn:(...x)=>{throw new Error(x.join(' '))}}, String, Promise, Set};
  vm.runInNewContext(read('assets/site.js'), sandbox, {filename:'site.js',timeout:3000});
  for(let i=0;i<12;i++) await Promise.resolve();
  return {document,ids,get copied(){return copied}};
}

test('real client logic renders actual repositories and their original publisher actions',async()=>{
  const ui=await runUI(),results=ui.ids.get('repository-list');
  assert.equal(results.children.length,12);
  assert.match(ui.ids.get('result-count').textContent,/12 repositories shown/);
  assert.ok(findNodes(results,n=>n.className==='repo-title').some(n=>n.textContent==='Yoru'));
  assert.equal(findNodes(results,n=>n.className==='copy-button').length,12);
  assert.equal(findNodes(results,n=>n.className==='copy-button'&&n.disabled).length,4);
  const yoru=results.children.find(card=>findNodes(card,n=>n.className==='repo-title').some(n=>n.textContent==='Yoru'));
  const expand=findNodes(yoru,n=>n.className==='more-button')[0];
  assert.equal(expand.getAttribute('aria-expanded'),'false');
  await expand.dispatch('click');
  assert.equal(expand.getAttribute('aria-expanded'),'true');
  assert.equal(findNodes(yoru,n=>n.className==='provider-name').length,29);
  await findNodes(yoru,n=>n.className==='copy-button')[0].dispatch('click');
  for(let i=0;i<3;i++)await Promise.resolve();
  assert.equal(ui.copied,'https://raw.githubusercontent.com/yoruix/nuvio-providers/refs/heads/main/manifest.json');
  assert.equal(ui.ids.get('toast').hidden,false);
});

test('search and language filtering can be combined and cleared without network calls',async()=>{
  const ui=await runUI();const results=ui.ids.get('repository-list');
  const search=ui.ids.get('search');
  search.value='AnimePahe';await search.dispatch('input');
  assert.equal(results.children.length,2);
  assert.match(ui.ids.get('result-count').textContent,/2 repositories shown/);
  const french=ui.ids.get('filters').children.find(n=>n.textContent.includes('Español'));
  assert.ok(french);
  await french.dispatch('click');
  assert.ok(findNodes(results,n=>n.className==='empty-state').length===1);
  const reset=findNodes(results,n=>n.className==='reset-button')[0];
  assert.ok(reset);await reset.dispatch('click');
  assert.equal(results.children.length,12);
  assert.equal(search.value,'');
});

test('sorting by provider count shows largest verified repository first',async()=>{
  const ui=await runUI();const sort=ui.ids.get('sort');
  sort.value='count';await sort.dispatch('change');
  const title=findNodes(ui.ids.get('repository-list').children[0],n=>n.className==='repo-title')[0];
  assert.equal(title.textContent,'All-in-One');
  const filtered=ui.ids.get('filters').children.find(n=>n.textContent.includes('Português'));
  assert.ok(filtered);
  await filtered.dispatch('click');
  assert.equal(ui.ids.get('repository-list').children.length,1);
  assert.equal(findNodes(ui.ids.get('repository-list'),n=>n.className==='repo-title')[0].textContent,'Saimuelbr');
});
