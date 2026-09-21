import sharp from 'sharp';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = `${root}public/assets/cholov2/v2`;
await mkdir(output, { recursive: true });
const definitions = [];
const add = (key, source, rect, height = 256, trim = true) => definitions.push({ key, source, rect, height, trim });
// Rectangles measured from the supplied sheets, not inferred from their labels.
const columns = [[16, 230], [273, 225], [545, 195], [787, 223], [1035, 230], [1301, 221]];
for (const [row, family] of ['taxi', 'redvan', 'policeBack'].entries()) {
  const ys = [[80, 190], [299, 205], [530, 182]][row];
  ['hardLeft', 'left', 'straight', 'right', 'hardRight', 'brake'].forEach((pose, i) =>
    add(`${family}-${pose}`, 'vehiculos', [columns[i][0], ys[0], columns[i][1], ys[1]], 220));
}
['combi', 'bus', 'mototaxi', 'auto', 'hatchback', 'truck'].forEach((key, i) =>
  add(key, 'vehiculos', [i * 256 + 10, 735, 238, 231], 260));
// The prompt calls it pasarejos; the supplied filename is pasajeros.
let passengerSource = 'pasarejos';
try { await access(`${root}imgs/cholov2/pasarejos.png`); } catch { passengerSource = 'pasajeros'; }
for (let i = 0; i < 6; i++) {
  add(`passenger-${i}`, passengerSource, [i * 256 + 15, 293, 225, 294], 240);
  add(`policeFront-${i}`, passengerSource, [i * 256 + 9, 815, 237, 193], 150);
}
['lamp', 'light', 'signRight', 'signLeft', 'tree', 'taxiStop'].forEach((key, i) =>
  add(key, passengerSource, [i * 256 + 25, 589, 213, 222], 320));
const obstacles = ['cone','barrier','concrete','barrel','hole','puddle','bump','manhole','tire','boxes','rubble','roadblock','coin','fuel','repair','pin'];
const obstacleRows = [[0, 326], [344, 267], [626, 274], [910, 340]];
obstacles.forEach((key, i) => {
  const [top, height] = obstacleRows[Math.floor(i / 4)];
  add(key, 'obstaculos', [Math.floor(i % 4 * 313.5), top, 313, height], 180);
});
[['house',[10,0,360,565]],['brick',[411,0,320,565]],['colonial',[767,80,400,485]],['tower',[1170,0,362,565]],['shop',[10,650,390,325]],['restaurant',[403,642,457,333]],['shelter',[862,679,369,300]],['palm',[1238,567,298,455]]]
  .forEach(([key, rect]) => add(key, 'ciudades', rect, 520));
['red','gold','pressed','disabled'].forEach((key,i)=>add(`button-${key}`,'botones',[i*384+20,30,360,152],90));
['left','right','brake','turbo','pause','sound','mute','home'].forEach((key,i)=>add(`control-${key}`,'botones',[(i%4)*384+60,i<4?199:474,272,265],128));
add('mirror','botones',[15,755,424,205],120);
for (const [row, name] of ['smoke','impact','water','flame'].entries()) {
  for(let i=0;i<6;i++) add(`${name}-${i}`,'adicionales',[i*256,row*256,256,256],200);
}
['idle','happy','right','left','shout','angry','victory','factos','scared','defeat','proud','run'].forEach((key,i)=>
  add(`driver-${key}`,'personaje',[(i%4)*362,Math.floor(i/4)*362,362,362],270));
add('sky','background',[0,0,1536,500],420,false);
add('skyline','background',[0,510,1536,514],330,false);
const manifest = {};
const previews = [];
for (const def of definitions) {
  const [left,top,width,height] = def.rect;
  const { data, info } = await sharp(`${root}imgs/cholov2/${def.source}.png`).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // Remove only near-transparent matte residue. RGB colors (including black) are preserved.
  if(def.trim) for(let i=3;i<data.length;i+=4) if(data[i]<20) data[i]=0;
  let pipeline=sharp(data,{raw:info});
  if(def.trim) pipeline=pipeline.trim({background:{r:0,g:0,b:0,alpha:0},threshold:1});
  const png=await pipeline.resize({height:def.height}).png().toBuffer();
  await writeFile(`${output}/${def.key}.png`,png);
  manifest[def.key]=`/assets/cholov2/v2/${def.key}.png`;
  const thumb=await sharp(png).resize({width:120,height:100,fit:'contain',background:'#464a54'}).png().toBuffer();
  previews.push({input:thumb,left:(previews.length%8)*120,top:Math.floor(previews.length/8)*100});
}
await writeFile(`${root}src/cholov2/assets.json`, JSON.stringify(manifest,null,2)+'\n');
await mkdir(`${root}artifacts/cholov2`,{recursive:true});
await sharp({create:{width:960,height:Math.ceil(previews.length/8)*100,channels:4,background:'#464a54'}}).composite(previews).png().toFile(`${root}artifacts/cholov2/contact-sheet.png`);
console.log(`Extracted ${definitions.length} named assets. Originals preserved. Contact sheet: artifacts/cholov2/contact-sheet.png`);
