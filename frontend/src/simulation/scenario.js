export function seededRandom(seed){let value=(Number.isFinite(Number(seed))?Number(seed):1)>>>0;return()=>{value+=0x6D2B79F5;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
export function buildScenario(knowledge,seed=42,protectedPositions=[]){
 const rand=seededRandom(seed),rows=knowledge.length,cols=knowledge[0].length;
 const protectedCells=new Set(protectedPositions.map(p=>`${p.row},${p.col}`));
 const truth=knowledge.map(row=>row.map(cell=>({...cell,mine:false}))),candidates=[];
 // Candidate coordinates come from grid dimensions and protected cells only.
 // Terrain edits therefore cannot shift mine locations for a given seed.
 for(let r=1;r<rows-1;r++)for(let c=1;c<cols-1;c++)if(!protectedCells.has(`${r},${c}`))candidates.push({row:r,col:c});
 for(let i=candidates.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]]}
 const mineCount=Math.min(candidates.length,Math.max(2,Math.round(rows*cols*.018)));
 for(const p of candidates.slice(0,mineCount))truth[p.row][p.col].mine=true;
 return truth
}
const SENSOR_RANGE=2;
function sensedCells(position,truth){const row=Math.round(position.row),col=Math.round(position.col),cells=[];for(let dr=-SENSOR_RANGE;dr<=SENSOR_RANGE;dr++)for(let dc=-SENSOR_RANGE;dc<=SENSOR_RANGE;dc++){const distance=Number(Math.hypot(dr,dc).toFixed(1));if(distance<=SENSOR_RANGE&&truth[row+dr]?.[col+dc])cells.push({row:row+dr,col:col+dc,distance})}return cells}
export function sensorReadings(position,truth){const cells=sensedCells(position,truth),obstruction=cells.filter(p=>truth[p.row][p.col].terrain==='obstacle').sort((a,b)=>a.distance-b.distance)[0],mine=cells.filter(p=>truth[p.row][p.col].mine).sort((a,b)=>a.distance-b.distance)[0];return{lidar:obstruction?.distance??null,metal:mine?'DETECTED':'CLEAR',metalDistance:mine?.distance??null,metalPosition:mine?{row:mine.row,col:mine.col}:null}}
export function processSensorData(knowledge,truth,position){const readings=sensorReadings(position,truth),hazard=sensedCells(position,truth).map(cell=>{const truthCell=truth[cell.row][cell.col],known=knowledge[cell.row][cell.col];if(truthCell.mine&&known.hazard!=='mine')return{type:'mine',position:{row:cell.row,col:cell.col},distance:cell.distance};if(truthCell.terrain==='obstacle'&&known.terrain!=='obstacle')return{type:'obstacle',position:{row:cell.row,col:cell.col},distance:cell.distance};return null}).filter(Boolean).sort((a,b)=>a.distance-b.distance||Number(b.type==='mine')-Number(a.type==='mine'))[0]??null;if(!hazard)return{readings,hazard:null,knowledge};const updated=knowledge.map(row=>row.map(item=>({...item}))),{row,col}=hazard.position,known=updated[row][col];updated[row][col]={...known,terrain:hazard.type==='obstacle'?'obstacle':known.terrain,confidence:1,hazard:hazard.type};return{readings,hazard,knowledge:updated}}
export function gps(position){return{lat:Number((37.421998+position.row*.0000125).toFixed(6)),lon:Number((-122.084+position.col*.0000125).toFixed(6))}}
