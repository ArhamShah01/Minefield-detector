export function keyOf(p){return `${p.row},${p.col}`}
export function neighbors(p, rows, cols){const out=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const row=p.row+dr,col=p.col+dc;if(row>=0&&col>=0&&row<rows&&col<cols)out.push({row,col})}return out}
export function astar(grid,start,goal,lineObstacles=[]){
 const rows=grid.length,cols=grid[0]?.length||0;
 if(!rows||!cols||!start||!goal||start.row<0||start.col<0||goal.row<0||goal.col<0||start.row>=rows||goal.row>=rows||start.col>=cols||goal.col>=cols)return{path:[],explored:0,reachable:false};
 const blocked=(row,col)=>grid[row]?.[col]?.terrain==='obstacle'||grid[row]?.[col]?.hazard==='mine';
 const mines=grid.flatMap((row,r)=>row.map((cell,c)=>cell.hazard==='mine'?{row:r,col:c}:null).filter(Boolean));
 const obstacles=grid.flatMap((row,r)=>row.map((cell,c)=>cell.terrain==='obstacle'?{row:r,col:c}:null).filter(Boolean));
 const pointSegmentDistance=(p,a,b)=>{const dr=b.row-a.row,dc=b.col-a.col,len=dr*dr+dc*dc,t=len?Math.max(0,Math.min(1,((p.row-a.row)*dr+(p.col-a.col)*dc)/len)):0;return Math.hypot(p.row-(a.row+t*dr),p.col-(a.col+t*dc))};
 const cross=(a,b,c)=>(b.col-a.col)*(c.row-a.row)-(b.row-a.row)*(c.col-a.col);
 const onSegment=(a,b,p)=>p.row>=Math.min(a.row,b.row)-1e-9&&p.row<=Math.max(a.row,b.row)+1e-9&&p.col>=Math.min(a.col,b.col)-1e-9&&p.col<=Math.max(a.col,b.col)+1e-9;
 const segmentsIntersect=(a,b,c,d)=>{const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);return(abC*abD<0&&cdA*cdB<0)||(Math.abs(abC)<1e-9&&onSegment(a,b,c))||(Math.abs(abD)<1e-9&&onSegment(a,b,d))||(Math.abs(cdA)<1e-9&&onSegment(c,d,a))||(Math.abs(cdB)<1e-9&&onSegment(c,d,b))};
 const segmentDistance=(a,b,c,d)=>segmentsIntersect(a,b,c,d)?0:Math.min(pointSegmentDistance(a,c,d),pointSegmentDistance(b,c,d),pointSegmentDistance(c,a,b),pointSegmentDistance(d,a,b));
 const pathDistance=(p,line)=>line.length===1?Math.hypot(p.row-line[0].row,p.col-line[0].col):line.slice(1).reduce((best,b,i)=>Math.min(best,pointSegmentDistance(p,line[i],b)),Infinity);
 const lineSegmentDistance=(a,b,line)=>line.length===1?pointSegmentDistance(line[0],a,b):line.slice(1).reduce((best,d,i)=>Math.min(best,segmentDistance(a,b,line[i],d)),Infinity);
 const clearFromPoint=(point,a,b,clearance)=>{const distance=pointSegmentDistance(point,a,b),startDistance=Math.hypot(point.row-a.row,point.col-a.col),endDistance=Math.hypot(point.row-b.row,point.col-b.col);return distance>=clearance||(startDistance<clearance&&endDistance>startDistance+.01&&distance>=startDistance-.02)};
 const segmentClear=(a,b)=>{
  if(!mines.every(m=>clearFromPoint(m,a,b,1))||!obstacles.every(o=>clearFromPoint(o,a,b,.66)))return false;
  return lineObstacles.every(line=>{if(!line.length)return true;const clearance=.62,distance=lineSegmentDistance(a,b,line),startDistance=pathDistance(a,line),endDistance=pathDistance(b,line);return distance>=clearance||(startDistance<clearance&&endDistance>startDistance+.01&&distance>=startDistance-.02)});
 };
 if(blocked(goal.row,goal.col))return{path:[],explored:0,reachable:false};
 const adjacent=p=>{const out=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const row=p.row+dr,col=p.col+dc,next={row,col};if(row<0||col<0||row>=rows||col>=cols||blocked(row,col)||!segmentClear(p,next))continue;if(dr&&dc&&(blocked(p.row+dr,p.col)||blocked(p.row,p.col+dc)))continue;out.push(next)}return out};
 const visible=(a,b)=>{if(!segmentClear(a,b))return false;const distance=Math.hypot(b.row-a.row,b.col-a.col),steps=Math.ceil(distance*16);for(let i=1;i<=steps;i++){const t=i/steps,row=Math.floor(a.row+(b.row-a.row)*t+.5),col=Math.floor(a.col+(b.col-a.col)*t+.5);if(blocked(row,col))return false}return true};
 const heuristic=p=>Math.hypot(p.row-goal.row,p.col-goal.col),open=[start],came=new Map(),g=new Map([[keyOf(start),0]]),f=new Map([[keyOf(start),heuristic(start)]]),closed=new Set();
 while(open.length){open.sort((a,b)=>(f.get(keyOf(a))??Infinity)-(f.get(keyOf(b))??Infinity));const current=open.shift(),ck=keyOf(current);if(closed.has(ck))continue;closed.add(ck);if(current.row===goal.row&&current.col===goal.col){const path=[current];let k=ck;while(came.has(k)){const prev=came.get(k);path.unshift(prev);k=keyOf(prev)}return{path,explored:closed.size,reachable:true}}for(const next of adjacent(current)){const nk=keyOf(next);if(closed.has(nk))continue;const parent=came.get(ck)??current,shortcut=visible(parent,next),via=shortcut?parent:current,tentative=(g.get(keyOf(via))??Infinity)+Math.hypot(next.row-via.row,next.col-via.col);if(tentative<(g.get(nk)??Infinity)){came.set(nk,via);g.set(nk,tentative);f.set(nk,tentative+heuristic(next));open.push(next)}}}
 return{path:[],explored:closed.size,reachable:false};
}
