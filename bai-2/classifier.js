'use strict';
// L2-normalised embeddings: squared Euclidean distance is equivalent
// to cosine ranking. Still k=3; no synthetic confidence percentage.
// Agreement is a vote count, never a calibrated probability.
(function(root){
  function classify(trained,vec){
    if(!trained.length)throw Error('Chưa có ảnh học');
    const normalise=v=>{const n=Math.sqrt(v.reduce((s,x)=>s+x*x,0));if(!n||!Number.isFinite(n))throw Error('Đặc trưng ảnh không hợp lệ');return v.map(x=>x/n)};
    const q=normalise(vec);
    const nearest=trained.map(t=>({cls:t.cls,d:normalise(t.vec).reduce((s,x,i)=>s+(x-q[i])**2,0)})).sort((a,b)=>a.d-b.d).slice(0,3);
    const votes=[0,0];nearest.forEach(x=>votes[x.cls]++);
    return {cls:votes[0]>=votes[1]?0:1,votes,agreement:Math.max(...votes),neighbours:nearest.length};
  }
  if(typeof module!=='undefined')module.exports={classify};
  else root.MitClassifier={classify};
})(typeof window!=='undefined'?window:globalThis);
