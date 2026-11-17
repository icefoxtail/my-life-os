el => new Promise(resolve => {
              const samples=[], start=performance.now(), minimumObservationMs=1000, minimumRafFrames=4, deadlineMs=10000;
              let raf=0, deadline;
              const finish=timedOut => {
                cancelAnimationFrame(raf);clearTimeout(deadline);
                const first=samples[0], svg=el.querySelector('.dockSvg');
                resolve({samples:samples.length,rafFrames:samples.length,timedOut,
                  elapsedMs:performance.now()-start,observationMs:samples.length ? samples.at(-1).atMs-first.atMs : 0,
                  minimumObservationMs,minimumRafFrames,deadlineMs,sampleTimesMs:samples.map(s=>s.atMs),
                  minWidth:samples.length ? Math.min(...samples.map(s=>s.width)) : null,
                  minHeight:samples.length ? Math.min(...samples.map(s=>s.height)) : null,
                  centerHit:samples.length>0 && samples.every(s=>s.hit),
                  maxRectDelta:samples.length ? Math.max(...samples.flatMap(s=>['x','y','width','height'].map(k=>Math.abs(s[k]-first[k])))) : null,
                  buttonAnimationCount:el.getAnimations().length,iconAnimationCount:svg.getAnimations().length});
              };
              const sample=() => {
                const atMs=performance.now()-start;
                if(atMs>=deadlineMs){finish(true);return;}
                const r=el.getBoundingClientRect(), hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
                samples.push({atMs,x:r.x,y:r.y,width:r.width,height:r.height,hit:hit===el||el.contains(hit)});
                if(atMs-samples[0].atMs>=minimumObservationMs && samples.length>=minimumRafFrames) finish(false);
                else raf=requestAnimationFrame(sample);
              };
              deadline=setTimeout(()=>finish(true),deadlineMs);
              raf=requestAnimationFrame(sample);
            })