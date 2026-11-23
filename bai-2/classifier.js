'use strict';
// L2-normalised embeddings: squared Euclidean distance is equivalent
// to cosine ranking. Still k=3; no synthetic confidence percentage.
// Agreement is a vote count, never a calibrated probability.
(function(root){
  function normalise(vec){
    let sum=0;
    for(let i=0;i<vec.length;i++)sum+=vec[i]*vec[i];
    const n=Math.sqrt(sum);
    if(!n||!Number.isFinite(n))throw Error('Đặc trưng ảnh không hợp lệ');
    const out=new Array(vec.length);
    for(let i=0;i<vec.length;i++)out[i]=vec[i]/n;
    return out;
  }

  function classify(trained,vec){
    if(!trained||!trained.length)throw Error('Chưa có ảnh học');
    const q=normalise(vec);
    const ranked=trained.map((t,index)=>{
      const p=normalise(t.vec);
      let d=0;
      for(let i=0;i<p.length;i++){
        const diff=p[i]-q[i];
        d+=diff*diff;
      }
      return {cls:t.cls,index,dist:d};
    }).sort((a,b)=>a.dist-b.dist);

    const nearest=ranked.slice(0,Math.min(3,ranked.length));
    const votes=[0,0];
    nearest.forEach(x=>{if(x.cls===0||x.cls===1)votes[x.cls]++;});
    return {
      cls:votes[0]>=votes[1]?0:1,
      votes,
      agreement:Math.max(votes[0],votes[1]),
      neighbours:nearest.length,
      nearest
    };
  }

  if(typeof module!=='undefined'&&module.exports)module.exports={classify};
  else root.MitClassifier={classify};
})(typeof window!=='undefined'?window:globalThis);
