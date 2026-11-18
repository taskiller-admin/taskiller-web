import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
// Synthetic API fixtures only: no production account or user data is accessed.
const baseURL = process.env.TASKILLER_REVIEW_URL ?? 'http://127.0.0.1:4173';
const out = 'docs/visual-review'; await mkdir(out,{recursive:true});
const workId='33333333-3333-4333-8333-333333333333', sessionId='44444444-4444-4444-8444-444444444444';
const user={id:'11111111-1111-4111-8111-111111111111',displayName:'Alex Morgan',email:'alex@example.com',emailVerified:true,updatedAt:'2026-11-18T10:00:00Z',createdAt:'2026-10-01T10:00:00Z',version:1};
const chore={id:workId,kind:'chore',name:'Shape the next chapter',description:'Bring the next version to life, one thoughtful step at a time.',status:'ready',parentId:null,workTypeId:null,position:1000,priority:3,estimatedEffortSeconds:1500,plannedStartAt:null,deadlineAt:null,targetStartDate:null,targetEndDate:null,characteristicOverrides:null,effectiveCharacteristics:null,completedAt:null,createdAt:user.createdAt,updatedAt:user.updatedAt,deletedAt:null,version:1};
const project={...chore,id:'55555555-5555-4555-8555-555555555555',kind:'project',name:'Launch something meaningful',status:'in_progress'};
const session={id:sessionId,workItemId:workId,state:'running',version:1,startedAt:new Date(Date.now()-120000).toISOString(),currentSegmentIndex:0,currentSegmentStartedAt:new Date(Date.now()-120000).toISOString(),pausedAt:null,endedAt:null,activeWorkSeconds:120,breakSeconds:0,pausedSeconds:0,planSnapshot:{segments:[{kind:'work',label:'Find your flow',durationMode:'fixed',targetSeconds:1500,optional:false,linkedWorkItemId:workId}]}};
const routes=[['landing','/'],['login','/login'],['register','/register'],['forgot-password','/forgot-password'],['reset-password','/reset-password'],['verify-email','/verify-email'],['account-deletion','/account-deletion-scheduled'],['offline','/offline'],['error','/nonexistent-visual-review'],['today','/today'],['inbox','/inbox'],['projects','/projects'],['work',`/work/${workId}`],['plan',`/work/${workId}/plan`],['session',`/session/${sessionId}`],['history','/history'],['analytics','/analytics'],['settings','/settings'],['guide','/guide']];
const browser=await chromium.launch();const results=[];
for(const [mode,width,height] of [['desktop',1440,1000],['mobile',390,844]]) for(const theme of ['light','dark']) {
 const context=await browser.newContext({viewport:{width,height},colorScheme:theme,serviceWorkers:'block',reducedMotion:'reduce'});const page=await context.newPage();
 await page.addInitScript(theme=>localStorage.setItem('taskiller-theme',theme),theme);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/__api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace('/__api/api/v1','');
  let json={items:[],page:{hasMore:false,nextCursor:null}};let status=200;
  if(path.startsWith('/auth/refresh')||path.startsWith('/auth/login'))json={accessToken:'review-token',tokenType:'Bearer',expiresIn:900,user};
  else if(path==='/me')json=user;
  else if(path==='/me/preferences')json={timezone:'Africa/Nairobi',locale:'en',weekStartsOn:1,defaultWorkSessionSeconds:1500,defaultBreakSeconds:300};
  else if(path==='/work-items')json={items:new URL(route.request().url()).searchParams.get('kind')==='chore'?[chore]:[chore,project],page:{hasMore:false,nextCursor:null}};
  else if(path===`/work-items/${workId}`)json=chore;
  else if(path==='/work-types')json={items:[{id:'writing',displayName:'Writing',system:true}]};
  else if(path==='/execution-sessions/active')json={session:null};
  else if(path===`/execution-sessions/${sessionId}`)json=session;
  else if(path.endsWith('/review')){json={};status=404;}
  else if(path.startsWith('/analytics')){
   const base={from:'2026-11-01T00:00:00Z',to:'2026-11-19T00:00:00Z',bucket:'day',timezone:'UTC'};
   if(path.endsWith('/summary'))json={...base,activeWorkSeconds:15300,breakSeconds:1800,pausedSeconds:300,sessionsCompleted:8,sessionsAbandoned:1,choresCompleted:4,requiredSegmentsCompleted:8,requiredSegmentsPlanned:10};
   else if(path.endsWith('/timeseries'))json={...base,points:Array.from({length:7},(_,i)=>({bucketStart:`2026-11-${11+i}T00:00:00Z`,activeWorkSeconds:[1800,2700,900,3600,2400,1500,2400][i],breakSeconds:300,pausedSeconds:0,sessionsCompleted:1,choresCompleted:1}))};
   else if(path.endsWith('/focus-patterns'))json={...base,items:[],timeOfDay:[{hourStart:9,activeWorkSeconds:3600,sessionCount:3,medianFocusScore:4}]};
  }
  await route.fulfill({status,json,headers:{ETag:'"review:1"'}});
 });
 for(const [name,url]of routes){
  const start=errors.length;await page.goto(baseURL+url, {waitUntil:'domcontentloaded'});await page.waitForLoadState('networkidle');await page.locator('h1').first().waitFor();await page.evaluate(()=>document.fonts.ready);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  const violations=(await new AxeBuilder({page}).analyze()).violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));
  results.push({mode,theme,name,overflow,errors:errors.slice(start),violations});
  if((theme==='light'&&['landing','login','today','projects','plan','session','analytics','settings'].includes(name))||(theme==='dark'&&['landing','today','session','settings'].includes(name)))await page.screenshot({path:`${out}/${name}-${mode}-${theme}.png`,fullPage:true});
  console.log(mode,theme,name,overflow?'OVERFLOW':'',violations.length?'AXE '+violations.length:'',errors.slice(start).join(','));
 }
 await context.close();
}
await writeFile(`${out}/checks.json`,JSON.stringify(results,null,2));await browser.close();
if(results.some(r=>r.overflow||r.errors.length||r.violations.length))process.exitCode=1;
