
import json, math, wave
from pathlib import Path
import numpy as np

SR = 22050
MASTER = 0.88
NOTE = {"C":0,"C#":1,"Db":1,"D":2,"D#":3,"Eb":3,"E":4,"F":5,"F#":6,"Gb":6,"G":7,"G#":8,"Ab":8,"A":9,"A#":10,"Bb":10,"B":11}

TRACKS = [
    "01_main_melody","02_counter_melody","03_harmony_melody","04_piano_chords",
    "05_toy_piano","06_xylophone","07_glockenspiel","08_music_box",
    "09_synth_pad","10_string_pad","11_brass_hit","12_bass","13_sub_bass",
    "14_kick","15_snare","16_clap","17_hihat","18_shaker","19_tambourine",
    "20_crash_cymbal","21_theme_fx","22_intro_fx","23_outro_fanfare","24_applause_cheer"
]

CHORDS = {
    "C": ([["C4","E4","G4"],["G3","B3","D4"],["A3","C4","E4"],["F3","A3","C4"]], ["C2","G1","A1","F1"]),
    "G": ([["G3","B3","D4"],["E3","G3","B3"],["C3","E3","G3"],["D3","F#3","A3"]], ["G1","E1","C1","D1"]),
    "F": ([["F3","A3","C4"],["C3","E3","G3"],["D3","F3","A3"],["Bb2","D3","F3"]], ["F1","C1","D1","Bb1"]),
    "E": ([["E3","G3","B3"],["C3","E3","G3"],["G2","B2","D3"],["D3","F#3","A3"]], ["E1","C1","G1","D1"])
}

MOTIFS = [
    [("C5",.5),("E5",.5),("G5",.5),("E5",.5),("C5",.5),("D5",.5),("E5",1)],
    [("E5",.5),("G5",.5),("A5",.5),("G5",.5),("E5",.5),("D5",.5),("E5",1)],
    [("G5",.5),("A5",.5),("B5",1),("A5",.5),("G5",.5),("E5",1)],
    [("D5",.5),("F5",.5),("A5",.5),("F5",.5),("D5",.5),("E5",.5),("F5",1)],
    [("C6",.5),("A5",.5),("G5",.5),("E5",.5),("D5",.5),("C5",.5),("G4",1)],
    [("E6",.5),("D6",.5),("B5",.5),("A5",.5),("G5",.5),("E5",.5),("D5",1)]
]

def note_freq(note):
    if note in (None, "", "R"):
        return None
    name = note[:-1]
    octave = int(note[-1])
    midi = (octave + 1) * 12 + NOTE[name]
    return 440 * (2 ** ((midi - 69) / 12))

def env(n, a=0.01, r=0.12):
    n = max(1, int(n))
    an = min(n//3, int(a*SR))
    rn = min(n//3, int(r*SR))
    e = np.ones(n, dtype=np.float32)
    if an > 0:
        e[:an] = np.linspace(0, 1, an, endpoint=False)
    if rn > 0:
        e[-rn:] = np.linspace(1, 0, rn, endpoint=True)
    return e

def osc(kind, f, dur):
    n = max(1, int(SR*dur))
    if f is None:
        return np.zeros(n, dtype=np.float32)
    t = np.arange(n, dtype=np.float32) / SR
    if kind == "sine":
        return np.sin(2*np.pi*f*t).astype(np.float32)
    if kind == "tri":
        return (2*np.abs(2*((f*t)%1)-1)-1).astype(np.float32)
    if kind == "saw":
        return (2*((f*t)%1)-1).astype(np.float32)
    if kind == "square":
        return np.sign(np.sin(2*np.pi*f*t)).astype(np.float32)
    return np.sin(2*np.pi*f*t).astype(np.float32)

def synth(kind, note, dur, vol):
    f = note_freq(note) if isinstance(note, str) else note
    n = max(1, int(SR*dur))
    if f is None:
        return np.zeros(n, dtype=np.float32)
    if kind == "lead":
        y = .72*osc("sine", f, dur) + .28*osc("tri", f*2, dur)
        return y * env(n, .002, min(.18,dur*.3)) * vol
    if kind == "counter":
        y = .65*osc("tri", f, dur) + .18*osc("sine", f*1.5, dur)
        return y * env(n, .01, min(.12,dur*.25)) * vol
    if kind == "piano":
        y = .64*osc("sine", f, dur) + .25*osc("tri", f*2, dur) + .08*osc("sine", f*3, dur)
        return y * env(n, .002, min(.16,dur*.25)) * vol
    if kind == "toy":
        y = .48*osc("square", f, dur) + .35*osc("tri", f*2, dur)
        return y * env(n, .003, min(.14,dur*.25)) * vol
    if kind == "bell":
        y = .78*osc("sine", f, dur) + .25*osc("sine", f*2.02, dur) + .10*osc("sine", f*3.97, dur)
        return y * env(n, .001, min(.30,dur*.45)) * vol
    if kind == "musicbox":
        y = .80*osc("sine", f, dur) + .20*osc("sine", f*2.01, dur)
        return y * env(n, .001, min(.38,dur*.45)) * vol
    if kind == "pad":
        y = .48*osc("sine", f, dur) + .22*osc("tri", f*.5, dur)
        return y * env(n, .12, min(.25,dur*.3)) * vol
    if kind == "string":
        y = .35*osc("saw", f, dur) + .30*osc("tri", f*1.01, dur)
        return y * env(n, .10, min(.24,dur*.3)) * vol
    if kind == "brass":
        y = .42*osc("saw", f, dur) + .32*osc("square", f, dur)
        return y * env(n, .02, min(.12,dur*.2)) * vol
    if kind == "bass":
        y = .80*osc("sine", f, dur) + .14*osc("square", f, dur)
        return y * env(n, .004, min(.08,dur*.2)) * vol
    if kind == "subbass":
        y = osc("sine", f*.5, dur)
        return y * env(n, .01, min(.10,dur*.2)) * vol
    return osc("sine", f, dur) * env(n) * vol

def add(dst, start, src):
    i = int(start*SR)
    if i >= len(dst): return
    j = min(len(dst), i+len(src))
    if j > i:
        dst[i:j] += src[:j-i]

def drum(kind, dur, vol, seed):
    n = max(1, int(SR*dur))
    t = np.arange(n, dtype=np.float32)/SR
    rng = np.random.default_rng(seed)
    if kind == "kick":
        f = np.linspace(120, 42, n)
        phase = np.cumsum(2*np.pi*f/SR)
        return np.sin(phase).astype(np.float32)*np.exp(-18*t)*vol
    if kind == "snare":
        return rng.normal(0,1,n).astype(np.float32)*np.exp(-20*t)*vol
    if kind == "hat":
        return rng.normal(0,1,n).astype(np.float32)*np.exp(-55*t)*vol
    if kind == "shaker":
        return rng.normal(0,1,n).astype(np.float32)*np.exp(-35*t)*vol
    if kind == "clap":
        raw = rng.normal(0,1,n).astype(np.float32)
        return raw*np.exp(-24*t)*vol
    if kind == "crash":
        return rng.normal(0,1,n).astype(np.float32)*np.exp(-5*t)*vol
    return np.zeros(n, dtype=np.float32)

def fx(kind, dur=.65, vol=.12):
    n = max(1, int(SR*dur))
    t = np.arange(n, dtype=np.float32)/SR
    if kind == "sparkle":
        y = sum(np.sin(2*np.pi*f*t)*np.exp(-(6+i*2)*t) for i,f in enumerate([1320,1760,2217,2637]))
        return y.astype(np.float32)*vol*.42
    if kind == "whoosh":
        raw = np.random.default_rng(70).normal(0,1,n).astype(np.float32)
        return raw*env(n,.03,.18)*np.linspace(.15,1,n)*vol*.35
    if kind == "honk":
        out = np.zeros(n, dtype=np.float32)
        add(out, 0, synth("brass","C4",.22,vol))
        add(out, .10, synth("brass","E4",.20,vol*.75))
        return out
    if kind == "train":
        out = np.zeros(n, dtype=np.float32)
        add(out, 0, synth("brass","G4",.28,vol))
        add(out, .18, synth("brass","C5",.24,vol*.75))
        return out
    if kind == "applause":
        raw = np.random.default_rng(80).normal(0,1,n).astype(np.float32)
        pulses = (np.sin(2*np.pi*8*t)>0).astype(np.float32)*.4+.6
        return raw*env(n,.02,.25)*pulses*vol*.45
    return fx("sparkle",dur,vol)

def write_wav(path, audio):
    m = float(np.max(np.abs(audio))) if len(audio) else 0
    if m > 1e-8:
        audio = np.clip(audio / max(1, m/MASTER), -1, 1)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes((audio*32767).astype(np.int16).tobytes())

def generate_song(spec, idx, out_dir):
    bpm = spec["bpm"]
    beat = 60 / bpm
    bars = int(spec.get("durationBars", 16))
    total = bars*4*beat + 1.6
    n = int(total*SR)
    tracks = {name: np.zeros(n, dtype=np.float32) for name in TRACKS}
    chords4, roots4 = CHORDS[spec["key"]]
    chords = (chords4*((bars//4)+1))[:bars]
    roots = (roots4*((bars//4)+1))[:bars]

    for bar in range(bars):
        cur = bar*4*beat
        for note, dur in MOTIFS[(bar+idx)%len(MOTIFS)]:
            add(tracks["01_main_melody"], cur, synth("lead", note, dur*beat, .17))
            add(tracks["03_harmony_melody"], cur, synth("lead", note, dur*beat, .045))
            cur += dur*beat

    for bar in range(1, bars, 2):
        cur = bar*4*beat
        for note, dur in MOTIFS[(bar+idx+2)%len(MOTIFS)][:4] + [("R",2)]:
            add(tracks["02_counter_melody"], cur, synth("counter", note, dur*beat, .085))
            cur += dur*beat

    cur = 0
    for ch in chords:
        for note in ch:
            add(tracks["04_piano_chords"], cur, synth("piano", note, 4*beat, .06))
            add(tracks["05_toy_piano"], cur, synth("toy", note, 2*beat, .028))
            add(tracks["09_synth_pad"], cur, synth("pad", note, 4*beat, .035))
            add(tracks["10_string_pad"], cur, synth("string", note, 4*beat, .025))
        arps = [(ch[0],.5),(ch[1],.5),(ch[2],.5),(ch[1],.5),(ch[0],.5),(ch[1],.5),(ch[2],1)]
        a_cur = cur
        for note, dur in arps:
            add(tracks["06_xylophone"], a_cur, synth("bell", note, dur*beat, .052))
            add(tracks["07_glockenspiel"], a_cur, synth("bell", note, dur*beat, .035))
            add(tracks["08_music_box"], a_cur, synth("musicbox", note, dur*beat, .030))
            a_cur += dur*beat
        cur += 4*beat

    cur = 0
    for root in roots:
        for _ in range(4):
            add(tracks["12_bass"], cur, synth("bass", root, beat*.92, .14))
            add(tracks["13_sub_bass"], cur, synth("subbass", root, beat*.92, .04))
            cur += beat

    mode = spec.get("preset","")
    for b in range(bars):
        base = b*4*beat
        kicks = [0,2]
        if "action" in mode: kicks = [0,.75,2,2.75]
        elif "drive" in mode or "train" in mode: kicks = [0,1.5,2,3]
        elif "march" in mode: kicks = [0,1.5,2,3.25]
        for k in kicks:
            add(tracks["14_kick"], base+k*beat, drum("kick", .18, .24, idx+1))
        for s in [1,3]:
            add(tracks["15_snare"], base+s*beat, drum("snare", .13, .055, idx+2))
        for c in [1.5,3.5]:
            add(tracks["16_clap"], base+c*beat, drum("clap", .14, .035, idx+3))
        for h in range(8):
            add(tracks["17_hihat"], base+h*beat/2, drum("hat", .055, .018 if h%2 else .025, idx+4))
        for sh in range(4):
            add(tracks["18_shaker"], base+sh*beat, drum("shaker", .07, .020, idx+5))
        for tb in [0.5,2.5]:
            add(tracks["19_tambourine"], base+tb*beat, drum("shaker", .09, .030, idx+6))
        if b in (0, bars//2, bars-1):
            add(tracks["20_crash_cymbal"], base, drum("crash", .45, .018, idx+7))

    fx_kind = spec.get("fx","sparkle")
    for t in [0.2, total*.32, total*.62, total-1.4]:
        add(tracks["21_theme_fx"], t, fx(fx_kind,.55,.11))
    add(tracks["22_intro_fx"], 0, fx("sparkle", .7, .12))
    add(tracks["23_outro_fanfare"], total-1.0, fx("sparkle", .65, .13))
    add(tracks["24_applause_cheer"], total-1.05, fx("applause", 1.0, .11))

    mix = np.zeros(n, dtype=np.float32)
    for tr in tracks.values():
        mix += tr

    out_path = Path(out_dir) / f"{spec['id']}.wav"
    write_wav(out_path, mix)
    return {
        "id": spec["id"],
        "title": spec["title"],
        "file": f"./assets/karaoke/{spec['id']}.wav",
        "durationSec": round(total, 2),
        "trackCount": len(TRACKS),
        "tracks": TRACKS,
        "status": "ready"
    }

def generate_all():
    base = Path(__file__).resolve().parents[1]
    specs_path = base / "data" / "karaoke-song-specs.json"
    out_dir = base / "assets" / "karaoke"
    out_dir.mkdir(parents=True, exist_ok=True)
    specs = json.loads(specs_path.read_text(encoding="utf-8"))
    manifest = [generate_song(spec, i, out_dir) for i, spec in enumerate(specs)]
    (base / "BGM_MANIFEST.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {len(manifest)} songs into {out_dir}")

if __name__ == "__main__":
    generate_all()
