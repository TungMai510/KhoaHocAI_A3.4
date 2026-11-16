// Feedback follows the learner's check, never the model's own guess.
(()=>{let timer;const zone=document.querySelector('.robot-zone'),layer=document.querySelector('#celebration');
function clear(){clearTimeout(timer);zone.classList.remove('is-happy','is-sad');zone.querySelector('.reaction-badge')?.remove();zone.querySelector('.emotion-icon')?.remove();layer.replaceChildren()}
function emotion(name){clear();if(name!=='think'&&name!=='sad')return;
 const icon=document.createElement('div');icon.className='emotion-icon '+name;icon.setAttribute('aria-hidden','true');
 icon.innerHTML=name==='think'?'<svg viewBox="0 0 90 110"><g fill="none" stroke="#e9ad29" stroke-width="5" stroke-linecap="round"><path d="M45 3v9M10 20l7 7M80 20l-7 7M3 52h10M77 52h10"/></g><path d="M28 74C4 50 21 23 45 23s41 27 17 51l-4 12H32Z" fill="#ffe680" stroke="#c58b24" stroke-width="3"/><path d="M38 57l7 9 7-9M45 66v20" fill="none" stroke="#c58b24" stroke-width="3"/><path d="M33 88h24M35 95h20M40 102h10" stroke="#708d88" stroke-width="5" stroke-linecap="round"/></svg>':'<svg viewBox="0 0 110 110"><path d="M20 48C0 44 4 22 23 24C28 3 58 0 69 21C93 11 112 39 94 50Z" fill="#a7c4d4" stroke="#7398ad" stroke-width="3"/><g fill="#6bb5dd"><path class="drop d1" d="M27 61q-14 20 0 20t0-20"/><path class="drop d2" d="M56 69q-14 20 0 20t0-20"/><path class="drop d3" d="M84 59q-14 20 0 20t0-20"/></g></svg>';
 zone.querySelector('.robot-stage').append(icon);if(name==='sad')zone.classList.add('is-sad');timer=setTimeout(clear,3500);
}
window.addEventListener('mitPose',e=>emotion(e.detail));
window.addEventListener('mitFeedback',e=>{clear();const happy=e.detail==='yes';zone.classList.add(happy?'is-happy':'is-sad');const badge=document.createElement('div');badge.className='reaction-badge'+(happy?'':' sad');badge.textContent=happy?'Hoan hô, mình làm được!':'Mình thử lại nhé!';badge.setAttribute('aria-hidden','true');zone.querySelector('.robot-speech').insertAdjacentElement('afterend',badge);
if(!happy){emotion('sad');zone.querySelector('.robot-speech').insertAdjacentElement('afterend',badge);}
if(happy&&!matchMedia('(prefers-reduced-motion: reduce)').matches){for(let i=0;i<90;i++){const bit=document.createElement('i');bit.className='confetti';const side=i%2;bit.style.setProperty('--color',['#ef5350','#ffbf00','#268be0','#36a961','#a960d9'][i%5]);bit.style.left=side?'80%':'20%';bit.style.top='72%';const x=(side?-1:1)*(40+Math.random()*innerWidth*.48),y=-180-Math.random()*Math.min(innerHeight*.65,500);bit.style.setProperty('--burst-x',x+'px');bit.style.setProperty('--burst-y',y+'px');bit.style.setProperty('--fall-x',x*1.25+'px');bit.style.setProperty('--fall-y',innerHeight*.4+'px');bit.style.setProperty('--spin',(i*43)+'deg');bit.style.animationDelay=(Math.floor(i/30)*.28)+'s';layer.append(bit)}}

clearTimeout(timer);timer=setTimeout(clear,4600);
});
for(const [id,name] of [['wave-motion','wave'],['think-motion','think'],['sad-motion','sad'],['try-motion','walk']])document.querySelector('#'+id)?.addEventListener('click',()=>emotion(name));
document.querySelector('#happy-motion')?.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('mitFeedback',{detail:'yes'})));
})();
