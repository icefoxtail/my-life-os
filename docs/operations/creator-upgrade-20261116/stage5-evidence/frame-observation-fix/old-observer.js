async el => {
              const samples=[], start=performance.now();
              do {
                const r=el.getBoundingClientRect(), hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
                samples.push({x:r.x,y:r.y,width:r.width,height:r.height,hit:hit===el||el.contains(hit)});
                await new Promise(requestAnimationFrame);
              } while(performance.now()-start<1000);
              const first=samples[0], svg=el.querySelector('.dockSvg');
              return {samples:samples.length,minWidth:Math.min(...samples.map(s=>s.width)),
                minHeight:Math.min(...samples.map(s=>s.height)),centerHit:samples.every(s=>s.hit),
                maxRectDelta:Math.max(...samples.flatMap(s=>['x','y','width','height'].map(k=>Math.abs(s[k]-first[k])))),
                buttonAnimationCount:el.getAnimations().length,iconAnimationCount:svg.getAnimations().length};
            }