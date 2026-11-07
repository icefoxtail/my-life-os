/* Syntax and integration checks for the playground upgrade; no browser claim. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const jsFiles=['sw.js','js/play-settings.js','js/vehicle-display.js','js/engine/webgl-fallback.js',
  'js/games/number-post-office-model.js','js/games/number-post-office.js','js/games/art-zone.js',
  'js/games/number-count.js','js/games/parking-lot.js','js/games/abc-phonics.js',
  'js/games/life-sequence.js','js/games/construction-site.js','js/games/megaDispatch.js'];
function syntax(file){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
jsFiles.forEach(file=>syntax(path.join(root,file)));
let inline=0;
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sihyeon-syntax-'));
try{
  for(const file of ['index.html','games/number-kingdom-3d.html','games/hangul-playmat-3d.html','scripts/qa-responsive.html','scripts/qa-legacy-play.html','scripts/qa/post-office-failure.html']){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
      if(!match[2].trim()||/\btype\s*=\s*["'](?:application\/[^"']+|importmap)["']/i.test(match[1]))continue;
      const script=path.join(temp,`${inline++}.mjs`);fs.writeFileSync(script,match[2]);syntax(script);
    }
  }
}finally{fs.rmSync(temp,{recursive:true,force:true});}
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
assert(!/boardland/i.test(index),'Boardland must not be routed or loaded');
assert(!/boardland/i.test(sw),'Boardland must not be precached');
assert(index.indexOf('js/games/number-post-office-model.js')<index.indexOf('js/games/number-post-office.js'),'model loads before UI');
for(const file of ['css/play-settings.css','css/games/number-post-office.css',...fs.readdirSync(path.join(root,'assets/games/number-post-office')).map(name=>'assets/games/number-post-office/'+name)]){
  assert(fs.statSync(path.join(root,file)).size>0,file);
  assert(sw.includes(`'./${file}'`),`${file} must be available in the install cache`);
}
console.log(`PASS: ${jsFiles.length} JS files, ${inline} inline scripts, Boardland removal, load order and new asset cache paths.`);
