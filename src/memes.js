// Meme library: Marvel / DC templates (loaded from imgflip's CDN at runtime, never copied into this repo).
// Many stills already carry the movie line as a subtitle: those get only a short `top` for the money context.
// Multi-panel ones get `labels` instead: [text, x%, y%], placed on the panel or person they're about.
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
  { mood: 'bad', src: img('2f3izw.jpg'), alt: 'Young Gamora asking Thanos what it cost', labels: [['what did this month cost?', 25, 40], ['everything', 75, 92]] },
  { mood: 'bad', src: img('s2zxn.jpg'), alt: 'Wolverine holding a photo, remembering', top: 'remember when you had money?' },
  { mood: 'bad', src: img('3g5k6.jpg'), alt: 'Peter Parker crying', top: 'scrolling my UPI history' },
  { mood: 'bad', src: img('31gy9w.jpg'), alt: 'Wanda: "You took everything from me." Thanos: "I don\'t even know who you are"', labels: [['me', 50, 8], ['online shopping', 50, 56]] },

  // broke
  { mood: 'broke', src: img('32jxka.jpg'), alt: 'Thanos: "Gone. Reduced to atoms"', top: 'my salary' },
  { mood: 'broke', src: img('2l1rk9.jpg'), alt: 'Tony Stark building in a cave', top: 'making it to month end', bottom: 'with a box of scraps' },
  { mood: 'broke', src: img('3udmbm.jpg'), alt: 'Hulk crying', top: 'my wallet' },
  { mood: 'broke', src: img('2hn32o.jpg'), alt: 'Doctor Strange looking into the futures', top: 'futures where i stay in budget', bottom: 'one' },

  // saving (jar has money)
  { mood: 'saving', src: img('miq09.jpg'), alt: 'Loki: "I have an army." Tony: "We have a Hulk"', labels: [['inflation', 30, 42], ['me, with a savings jar', 50, 93]] },
  { mood: 'saving', src: img('31lb68.jpg'), alt: 'Thor lifting the hammer: "I\'m still worthy!"', top: 'my jar after a month of round-ups' },

  // nosave (jar empty)
  { mood: 'nosave', src: img('2zv92r.png'), alt: 'Thanos: "I am inevitable"', top: 'me, near my savings' },
  { mood: 'nosave', src: img('2ug9y2.jpg'), alt: 'Loki: "I\'ve never met this man in my life"', top: 'me, looking at the savings jar' },

  // any
  { mood: 'any', src: img('1tkjq9.jpg'), alt: 'Spider-Men pointing at each other', labels: [['my spending', 27, 55], ['my salary', 75, 55]] },
  { mood: 'any', src: img('2bq05e.jpg'), alt: 'T\'Challa holding up a hand', top: 'paying full price', bottom: "we don't do that here" },
  { mood: 'any', src: img('3d6lbp.jpg'), alt: 'Joker: "You wouldn\'t get it"', top: 'me logging every ₹10' },

  // ── more ──
  { mood: 'good', src: img('3bp4vk.jpg'), alt: 'Thor: "Because that\'s what heroes do"', top: 'paying friends back on time' },
  { mood: 'good', src: img('63c62i.jpg'), alt: 'Doc Ock: "The power of the sun in the palm of my hand"', top: 'me holding ₹500 on the 28th' },
  { mood: 'good', src: img('2jay5q.jpg'), alt: 'Peter Parker without and with glasses', labels: [['my spending', 75, 25], ['my spending with the app', 75, 75]] },

  { mood: 'mid', src: img('454qs6.png'), alt: 'Joker: "Do I really look like a guy with a plan?"', top: 'me on the 1st of the month' },
  { mood: 'mid', src: img('3o3dk5.png'), alt: 'Doc Ock: "There\'s three, actually"', top: '"i only have one subscription"' },
  { mood: 'mid', src: img('30rum6.png'), alt: 'Drax: "I\'ve mastered the ability of standing so incredibly still that I become invisible to the eye"', top: 'me hiding from my budget' },
  { mood: 'mid', src: img('8yw3s3.jpg'), alt: 'The Thing: "Say that again?"', top: '"just one more online order"' },
  { mood: 'mid', src: img('2g38ky.jpg'), alt: 'Hela: "You can\'t defeat me." Thor: "I know, but he can"', labels: [['my budget', 50, 18], ['food delivery', 50, 92]] },
  { mood: 'mid', src: img('29egnf.jpg'), alt: 'Aquaman sneaking up behind Superman', labels: [['me, finally saving', 62, 45], ['surprise expenses', 20, 64]] },

  { mood: 'bad', src: img('361ryn.jpg'), alt: 'Loki falling through a portal', top: 'my balance', bottom: 'falling for 30 days straight' },
  { mood: 'bad', src: img('39fcqj.png'), alt: 'Ant-Man: "What the hell happened here?"', top: 'me opening my bank app' },
  { mood: 'bad', src: img('1476d.jpg'), alt: 'Shocked Batman', top: 'that ₹999 subscription i forgot' },
  { mood: 'bad', src: img('pms7g.jpg'), alt: 'Wolverine walking away from an explosion', top: 'me closing the bank app' },
  { mood: 'bad', src: img('28c6qe.jpg'), alt: 'Drax and Mantis laughing', top: 'my friends seeing my balance' },

  { mood: 'broke', src: img('378dxg.jpg'), alt: 'Mysterio: "Now this is an Avengers level threat"', top: 'month end with ₹50 left' },
  { mood: 'broke', src: img('31wp0l.jpg'), alt: 'Hawkeye: "Don\'t do that. Don\'t give me hope"', top: 'bank: ₹1 credited' },
  { mood: 'broke', src: img('31xbl1.jpg'), alt: 'Black Widow: "Let me go." Hawkeye: "No"', labels: [['my last ₹100', 50, 8], ['me', 20, 62]] },
  { mood: 'broke', src: img('4j59hf.jpg'), alt: 'Kingpin: "Business is boomin\'"', top: 'food apps when i get paid' },

  { mood: 'saving', src: img('31umw7.jpg'), alt: 'Hulk handing Ant-Man a taco', labels: [['me, after saving ₹50', 66, 12], ['also me', 30, 62]] },
  { mood: 'saving', src: img('19e5ji.jpg'), alt: 'Deadpool gasping', top: 'the jar crossed ₹100' },
  { mood: 'saving', src: img('3017ei.png'), alt: 'Drax: "I, too, am extraordinarily humble"', top: 'me after saving ₹100' },
  { mood: 'saving', src: img('3xjuz3.jpg'), alt: 'Bruce Banner: "That\'s my secret, Cap"', top: 'my secret to saving?', bottom: "i'm always broke" },

  { mood: 'nosave', src: img('6q75zl.jpg'), alt: 'Peacemaker: "He does exactly what I do. But better"', top: 'my friend who actually saves' },

  { mood: 'any', src: img('1d0w4v.jpg'), alt: 'Thor happy, then sad', labels: [['payday', 50, 8], ['rent day', 50, 58]] },
  { mood: 'any', src: img('30f2oa.jpg'), alt: 'Tony Stark: "Everywhere I go, I see his face"', top: 'ads after one online order' },
  { mood: 'any', src: img('37g1br.png'), alt: 'Thanos: "Perhaps I treated you too harshly"', top: 'me to my budget on the 1st' },
  { mood: 'any', src: img('40m73k.png'), alt: 'Green Goblin: "You and I are not so different"', top: 'me to my broke friend' },
  { mood: 'any', src: img('19e54v.jpg'), alt: 'Black Widow, arms crossed, not impressed', top: '"let\'s split it equally"' },

  // ── batch 3 ──
  { mood: 'good', src: img('30zvo.jpg'), alt: 'Tony Stark on stage, arms wide', top: 'me after a no-spend week' },
  { mood: 'good', src: img('5kmp8s.png'), alt: 'Doctor Strange: "Feels weird, but I\'ll allow it"', top: '₹0 delivery fee' },
  { mood: 'good', src: img('8n91ax.jpg'), alt: 'Superman smiling', top: 'when a friend pays me back' },

  { mood: 'mid', src: img('5izijf.png'), alt: 'Ultron: "You\'re unbearably naive"', top: '"i\'ll start saving next month"' },
  { mood: 'mid', src: img('34d8en.png'), alt: 'Aunt May: "Shame on you"', top: 'ordering food 3 times today' },
  { mood: 'mid', src: img('3howrg.png'), alt: 'Commissioner Gordon: "Wait! WAIT!"', top: 'me before paying ₹2,000 for shoes' },

  { mood: 'bad', src: img('1o9p0u.jpg'), alt: 'Alfred talking to Bruce Wayne', top: 'food apps at 2am', bottom: 'some men just want to watch the world burn' },
  { mood: 'bad', src: img('135qld.jpg'), alt: 'Nick Fury pointing, angry', top: 'who ordered food again?' },
  { mood: 'bad', src: img('7p483p.jpg'), alt: 'Miles Morales shocked', top: 'my monthly food spend' },
  { mood: 'bad', src: img('4k36pv.png'), alt: 'Doc Ock: "It can\'t be stopped. It\'s self-sustaining now"', top: 'my food delivery habit' },

  { mood: 'broke', src: img('5kozbh.jpg'), alt: 'Doc Ock turning around', top: 'my credit card bill', bottom: 'hello, peter' },

  { mood: 'saving', src: img('3138fk.jpg'), alt: 'Thanos: "I am inevitable." Tony: "And I am Iron Man"', labels: [['my expenses', 50, 12], ['my savings jar', 50, 62]] },

  { mood: 'nosave', src: img('2wxigk.jpg'), alt: 'Red Skull: "I guide others to a treasure I cannot possess"', top: 'me telling friends to save money' },

  { mood: 'any', src: img('1a8qy1.jpg'), alt: 'Tony Stark relieved, hand on chest', top: 'the salary SMS finally came' },
  { mood: 'any', src: img('3cz6yc.png'), alt: 'Captain America running past Falcon: "On your left"', labels: [['my salary', 28, 62], ['my expenses', 72, 50]] },
  { mood: 'any', src: img('4ahuab.png'), alt: 'Peter Parker: "Happy, is that you?"', top: '₹500 in my old jeans' },
  { mood: 'any', src: img('5klcv7.png'), alt: 'Lex Luthor thinking hard', top: 'me working out if i can afford it' },
  { mood: 'any', src: img('3wjlca.jpg'), alt: 'Black Panther arms crossed: "Wakanda forever"', top: 'me refusing to pay a delivery fee' },
  { mood: 'any', src: img('8z1efp.png'), alt: 'Homelander staring', top: 'me seeing ₹300 for a coffee' },
  { mood: 'any', src: img('2yd7k8.jpg'), alt: 'Drax pointing and laughing', top: 'me when my friend is broker than me' },
  { mood: 'any', src: img('34kgtz.jpg'), alt: '"You shouldn\'t be here." "Neither should you"', top: 'me and ₹5,000 at a mall' },
]

/** Moods for how the month is going (`used` = share of your money spent). */
export const budgetMood = (used, hasBudget) =>
  !hasBudget || used > 1 ? 'broke' : used > 0.8 ? 'bad' : used > 0.5 ? 'mid' : 'good'

/**
 * Every meme plus your own, with {pct} filled in. Ones that fit these moods (and 'any', and yours) are marked
 * `fits`: drawMeme deals those first, then the rest, so a page never loops over just its few mood memes.
 */
export function pool(moods, pct = 0) {
  const fill = s => s?.replace('{pct}', `${Math.round(pct * 100)}%`)
  return [...MEMES, ...myMemes()].map(m => ({
    ...m, top: fill(m.top), bottom: fill(m.bottom), fits: m.mood === 'any' || moods.includes(m.mood),
  }))
}

// Shuffled deck: memes you've seen are skipped until every one has been shown (mood-fitting ones first),
// remembered across pages and app launches, so nothing comes back after one or two taps.
const SEEN = 'savings.memeSeen'
const keyOf = m => m.id ?? m.src
/** A random meme from `pool` you haven't seen lately (never `avoid`). Marks it seen. */
export function drawMeme(pool, avoid) {
  if (!pool.length) return null
  let seen = []
  try { seen = JSON.parse(localStorage.getItem(SEEN)) || [] } catch { /* start fresh */ }
  const fresh = m => !seen.includes(keyOf(m)) && keyOf(m) !== keyOf(avoid ?? {})
  const unseen = pool.filter(fresh)
  let left = unseen.some(m => m.fits !== false) ? unseen.filter(m => m.fits !== false) : unseen // mood ones first
  if (!left.length) { // whole pool seen: new round, forget this pool's memes
    const mine = new Set(pool.map(keyOf))
    seen = seen.filter(k => !mine.has(k))
    left = pool.filter(m => pool.length < 2 || keyOf(m) !== keyOf(avoid ?? {}))
  }
  const m = left[Math.floor(Math.random() * left.length)]
  localStorage.setItem(SEEN, JSON.stringify([...seen, keyOf(m)].slice(-300)))
  return m
}

// Your own memes: picked from the gallery, shrunk to a small JPEG and kept on the phone in localStorage
// (survives app updates). They show up everywhere, mixed in with the rest.
// ponytail: localStorage holds ~5 MB, about 60 memes at this size; move to IndexedDB if people want more
const MINE = 'savings.memes'
export const myMemes = () => { try { return JSON.parse(localStorage.getItem(MINE)) || [] } catch { return [] } }
const saveMine = list => localStorage.setItem(MINE, JSON.stringify(list))

/** Shrink a picked image (longest side 720px) and save it with optional captions. Throws if storage is full. */
export async function addMyMeme(file, top, bottom) {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, 720 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k)
  c.height = Math.round(bmp.height * k)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  const m = { id: Date.now(), mood: 'any', src: c.toDataURL('image/jpeg', 0.8), alt: 'Your meme', top: top.trim(), bottom: bottom.trim() }
  saveMine([...myMemes(), m]) // throws QuotaExceededError when full
  return m
}

export const deleteMyMeme = id => saveMine(myMemes().filter(m => m.id !== id))
