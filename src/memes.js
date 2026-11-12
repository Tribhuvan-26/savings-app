// Meme library: Marvel / DC templates (loaded from imgflip's CDN at runtime, never copied into this repo).
// Many stills already carry the movie line as a subtitle: those get only a short `top` for the money context.
// Captions only where the scene needs one. `{pct}` in a caption becomes how much of your money is spent.
// `mood` picks where a meme can show up:
//   good: under half spent · mid: 50-80% · bad: 80-100% · broke: over, or no balance yet
//   saving / nosave: the jar has money / is empty · any: fits everywhere

const img = file => `https://i.imgflip.com/${file}`

export const MEMES = [
  // good
  { mood: 'good', src: img('303krn.jpg'), alt: 'Thanos: "Perfectly balanced, as all things should be"', top: 'my budget this month' },
  { mood: 'good', src: img('21bbsj.jpg'), alt: 'Thanos smiling with the gauntlet', top: 'still got money', bottom: 'this far into the month' },
  { mood: 'good', src: img('31lb68.jpg'), alt: 'Thor lifting the hammer: "I\'m still worthy!"', top: 'my budget, 3 weeks in' },

  // mid
  { mood: 'mid', src: img('2dmk14.jpg'), alt: 'Thor asking "is he though?"', top: '"i\'m good with money"', bottom: 'is he though' },
  { mood: 'mid', src: img('5dqanb.png'), alt: 'Loki: "Yes, very sad. Anyway"', top: '{pct} of my money gone' },
  { mood: 'mid', src: img('324xv9.jpg'), alt: 'Old Captain America: "No, I don\'t think I will"', top: 'budget: stop ordering food' },
  { mood: 'mid', src: img('4i5d80.png'), alt: 'Nick Fury: "I recognize the council has made a decision, but given that it\'s a stupid-ass decision, I\'ve elected to ignore it"', top: 'my budget said no' },

  // bad
  { mood: 'bad', src: img('2f3izw.jpg'), alt: 'Young Gamora asking Thanos what it cost', top: 'what did this month cost?', bottom: 'everything' },
  { mood: 'bad', src: img('s2zxn.jpg'), alt: 'Wolverine holding a photo, remembering', top: 'remember when you had money?' },
  { mood: 'bad', src: img('3g5k6.jpg'), alt: 'Peter Parker crying', top: 'scrolling my UPI history' },
  { mood: 'bad', src: img('31gy9w.jpg'), alt: 'Wanda: "You took everything from me." Thanos: "I don\'t even know who you are"', top: 'me vs online shopping' },

  // broke
  { mood: 'broke', src: img('32jxka.jpg'), alt: 'Thanos: "Gone. Reduced to atoms"', top: 'my salary' },
  { mood: 'broke', src: img('2l1rk9.jpg'), alt: 'Tony Stark building in a cave', top: 'making it to month end', bottom: 'with a box of scraps' },
  { mood: 'broke', src: img('3udmbm.jpg'), alt: 'Hulk crying', top: 'my wallet' },
  { mood: 'broke', src: img('2hn32o.jpg'), alt: 'Doctor Strange looking into the futures', top: 'futures where i stay in budget', bottom: 'one' },

  // saving (jar has money)
  { mood: 'saving', src: img('miq09.jpg'), alt: 'Loki: "I have an army." Tony: "We have a Hulk"', top: 'inflation: i have an army', bottom: 'me: i have a savings jar' },
  { mood: 'saving', src: img('31lb68.jpg'), alt: 'Thor lifting the hammer: "I\'m still worthy!"', top: 'my jar after a month of round-ups' },

  // nosave (jar empty)
  { mood: 'nosave', src: img('2zv92r.png'), alt: 'Thanos: "I am inevitable"', top: 'me, near my savings' },
  { mood: 'nosave', src: img('2ug9y2.jpg'), alt: 'Loki: "I\'ve never met this man in my life"', top: 'me, looking at the savings jar' },

  // any
  { mood: 'any', src: img('1tkjq9.jpg'), alt: 'Spider-Men pointing at each other', top: 'my spending', bottom: 'my salary' },
  { mood: 'any', src: img('2bq05e.jpg'), alt: 'T\'Challa holding up a hand', top: 'paying full price', bottom: "we don't do that here" },
  { mood: 'any', src: img('3d6lbp.jpg'), alt: 'Joker: "You wouldn\'t get it"', top: 'me logging every ₹10' },
]

/** Moods for how the month is going (`used` = share of your money spent). */
export const budgetMood = (used, hasBudget) =>
  !hasBudget || used > 1 ? 'broke' : used > 0.8 ? 'bad' : used > 0.5 ? 'mid' : 'good'

/** All memes for these moods (plus the 'any' ones), with {pct} filled in. */
export function pool(moods, pct = 0) {
  const fill = s => s?.replace('{pct}', `${Math.round(pct * 100)}%`)
  return MEMES.filter(m => m.mood === 'any' || moods.includes(m.mood)).map(m => ({ ...m, top: fill(m.top), bottom: fill(m.bottom) }))
}
