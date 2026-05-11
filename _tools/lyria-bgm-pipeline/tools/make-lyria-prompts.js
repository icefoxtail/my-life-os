const fs = require('fs');
const path = require('path');

const SPECS_FILE = path.join(__dirname, '../data/karaoke-lyria-song-specs.json');
const OUT_DIR = path.join(__dirname, '../prompts');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const specs = JSON.parse(fs.readFileSync(SPECS_FILE, 'utf-8'));

const TEMPLATE = `Create a high-quality instrumental background music track for a preschool family karaoke app.

Title: {title}
Target: 4-year-old Korean child and family karaoke.
Duration: 35–45 seconds.
Audio style: bright, warm, premium kids karaoke backing track.
Arrangement: rich 24+ layer full arrangement, but still clean and child-friendly.
No vocals. No lyrics. Instrumental only.
{antiCopyright}
The melody must be original, simple, clear, catchy, and easy for a child to sing along.

Theme: {theme}
Mood: {mood}
Special effects: {specialEffects}

Instrumentation:
- clear lead melody
- counter melody
- harmony melody
- warm piano chords
- toy piano
- xylophone
- glockenspiel
- music box sparkle
- soft synth pad
- gentle string pad
- cute brass accents
- round bass
- soft sub bass
- kick
- snare
- clap
- hi-hat
- shaker
- tambourine
- crash cymbal
- theme sound effects
- short intro effect
- short ending fanfare
- applause and cheer

Mixing:
- leave space for a child vocal on top
- keep the lead melody clear but not too loud, so a child can sing over it
- no harsh high frequencies
- no clipping
- warm stereo image
- clear beat
- loop-friendly ending or short happy ending
- tablet speaker friendly
- no long silence at the beginning
- no long silence at the end
- strong opening within the first 1 second
- clear ending cue for karaoke completion

Output:
Instrumental only.
No vocal.
No spoken words.
No lyrics.`;

function fillTemplate(template, spec) {
  return template
    .replaceAll('{title}', spec.title)
    .replaceAll('{antiCopyright}', spec.antiCopyright)
    .replaceAll('{theme}', spec.theme)
    .replaceAll('{mood}', spec.mood)
    .replaceAll('{specialEffects}', spec.specialEffects);
}

specs.forEach((spec, index) => {
  const num = String(index + 1).padStart(2, '0');
  const promptText = fillTemplate(TEMPLATE, spec);
  const filename = `${num}_${spec.id}.txt`;

  fs.writeFileSync(path.join(OUT_DIR, filename), promptText, 'utf-8');
  console.log(`Generated: ${filename}`);
});

console.log('All 16 prompts generated successfully!');
