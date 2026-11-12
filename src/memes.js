// Meme library: classic templates (loaded from imgflip's CDN at runtime, never copied into this repo) with money
// captions. `mood` picks where a meme can show up; `{pct}` in a caption becomes how much of your money is spent.
//   good: under half spent · mid: 50-80% · bad: 80-100% · broke: over, or no balance yet
//   saving / nosave: the jar has money / is empty · any: fits everywhere

const img = id => `https://i.imgflip.com/${id}`

export const MEMES = [
  // good
  { mood: 'good', src: img('39t1o.jpg'), alt: 'Leonardo DiCaprio raising a glass', top: 'still got money', bottom: 'this far into the month' },
  { mood: 'good', src: img('1h7in3.jpg'), alt: 'Roll Safe tapping his head', top: "can't overspend", bottom: 'if you track every rupee' },
  { mood: 'good', src: img('8d317n.png'), alt: 'Absolute Cinema hands', top: 'my budget this month', bottom: 'absolute cinema' },
  { mood: 'good', src: img('4acd7j.png'), alt: 'Leonardo DiCaprio laughing', top: 'me checking my balance', bottom: "and it's still positive" },
  { mood: 'good', src: img('hmt3v.jpg'), alt: "I'm the captain now", top: 'look at me', bottom: "i'm the budget now" },
  { mood: 'good', src: img('2odckz.jpg'), alt: 'Marked safe from', top: 'marked safe from', bottom: 'going broke today' },
  { mood: 'good', src: img('4pn1an.png'), alt: "They don't know, guy at a party", top: "they don't know", bottom: 'i track every single rupee' },
  { mood: 'good', src: img('2ybua0.png'), alt: 'Tuxedo Winnie the Pooh', top: 'spending money', bottom: 'allocating capital' },

  // mid
  { mood: 'mid', src: img('gk5el.jpg'), alt: 'Hide the Pain Harold smiling', top: 'checking my balance', bottom: "it's fine. i'm fine." },
  { mood: 'mid', src: img('2gnnjh.jpg'), alt: 'Monkey puppet looking away', top: 'when the app shows', bottom: 'what you spent on snacks' },
  { mood: 'mid', src: img('1otk96.jpg'), alt: 'Mocking SpongeBob', top: "i'll save next month", bottom: "i'Ll SaVe NeXt MoNtH" },
  { mood: 'mid', src: img('1e7ql7.jpg'), alt: 'Evil Kermit', top: 'me: i should save', bottom: 'also me: order biryani' },
  { mood: 'mid', src: img('145qvv.jpg'), alt: 'Squidward at the window', top: 'me watching my friends', bottom: 'spend like it is salary day' },
  { mood: 'mid', src: img('72epa9.png'), alt: 'Lenny, 0 days without', top: '0 days without', bottom: 'ordering food online' },
  { mood: 'mid', src: img('19vcz0.jpg'), alt: 'Pawn Stars, best I can do', top: 'my wallet for weekend plans', bottom: "best i can do is ₹40" },

  // bad
  { mood: 'bad', src: img('wxica.jpg'), alt: 'This Is Fine dog in a burning room', top: '{pct} of my money gone', bottom: 'this is fine' },
  { mood: 'bad', src: img('46e43q.png'), alt: 'Always has been, astronauts', top: "wait, it's all spent?", bottom: 'always has been' },
  { mood: 'bad', src: img('2kbn1e.jpg'), alt: 'Surprised Pikachu', top: 'spends all month', bottom: 'shocked at month end' },
  { mood: 'bad', src: img('1itoun.jpg'), alt: 'Charlie conspiracy board', top: 'me figuring out', bottom: 'where all my money went' },
  { mood: 'bad', src: img('26am.jpg'), alt: 'Ancient Aliens guy', top: 'where did my money go?', bottom: 'aliens' },
  { mood: 'bad', src: img('1bhw.jpg'), alt: 'Grandma finds the internet', top: 'me discovering', bottom: 'how much i spent on food' },
  { mood: 'bad', src: img('gtj5t.jpg'), alt: 'Oprah, you get a', top: 'you get a UPI payment', bottom: 'everybody gets a UPI payment' },

  // broke
  { mood: 'broke', src: img('23ls.jpg'), alt: 'Disaster Girl smirking at a fire', top: 'my budget', bottom: 'me with UPI' },
  { mood: 'broke', src: img('3oevdk.jpg'), alt: 'Bernie, once again asking', top: 'i am once again asking', bottom: 'for salary to come early' },
  { mood: 'broke', src: img('1c1uej.jpg'), alt: 'Sad Pablo Escobar waiting', top: 'waiting', bottom: 'for the salary SMS' },
  { mood: 'broke', src: img('21uy0f.jpg'), alt: "Y'all got any more of that", top: "y'all got any more", bottom: 'of that salary' },
  { mood: 'broke', src: img('1bip.jpg'), alt: 'Bad Luck Brian', top: 'finally saves ₹500', bottom: 'phone screen cracks' },
  { mood: 'broke', src: img('1bgw.jpg'), alt: 'Futurama Fry squinting', top: 'not sure if saving', bottom: 'or just broke' },

  // saving (jar has money)
  { mood: 'saving', src: img('8k0sa.jpg'), alt: 'Yoda', top: 'save you must', bottom: 'spare change, it adds up' },
  { mood: 'saving', src: img('1h7in3.jpg'), alt: 'Roll Safe tapping his head', top: "can't go broke", bottom: 'if you save the spare change' },
  { mood: 'saving', src: img('5youx3.jpg'), alt: 'Muscular guy in a competition', top: 'my jar', bottom: 'after a month of round-ups' },
  { mood: 'saving', src: img('39t1o.jpg'), alt: 'Leonardo DiCaprio raising a glass', top: 'to every ₹2', bottom: 'that went into the jar' },

  // nosave (jar empty)
  { mood: 'nosave', src: img('2fm6x.jpg'), alt: 'Skeleton waiting on a bench', top: 'me waiting', bottom: 'for my first savings' },
  { mood: 'nosave', src: img('1wz1x.jpg'), alt: "Where I'd put my trophy if I had one", top: "this is where i'd keep my savings", bottom: 'if i had any' },
  { mood: 'nosave', src: img('3i7p.jpg'), alt: 'Imagination SpongeBob', top: 'my savings', bottom: 'imagination' },
  { mood: 'nosave', src: img('65939r.jpg'), alt: 'Megamind, no', top: 'no savings?', bottom: '' },
  { mood: 'nosave', src: img('265k.jpg'), alt: 'Skeptical kid', top: 'so you saved money', bottom: 'this month?' },

  // any
  { mood: 'any', src: img('1bij.jpg'), alt: 'One does not simply', top: 'one does not simply', bottom: 'stick to a budget' },
  { mood: 'any', src: img('24y43o.jpg'), alt: 'Change my mind', top: 'chai is not an expense', bottom: 'change my mind' },
  { mood: 'any', src: img('1ihzfe.jpg'), alt: 'Buzz and Woody, X everywhere', top: 'UPI payments', bottom: 'UPI payments everywhere' },
  { mood: 'any', src: img('5v6gwj.jpg'), alt: 'Two guys on a bus', top: 'people who track spending', bottom: "people who don't" },
  { mood: 'any', src: img('21tqf4.jpg'), alt: 'The scroll of truth', top: '₹40 chai every day', bottom: 'is ₹1,200 a month' },
  { mood: 'any', src: img('30b1gx.jpg'), alt: 'Drake approving', top: 'café coffee', bottom: 'tapri chai' },
  { mood: 'any', src: img('1tkjq9.jpg'), alt: 'Spider-Men pointing at each other', top: 'my spending', bottom: 'my salary' },
]

/** Moods for how the month is going (`used` = share of your money spent). */
export const budgetMood = (used, hasBudget) =>
  !hasBudget || used > 1 ? 'broke' : used > 0.8 ? 'bad' : used > 0.5 ? 'mid' : 'good'

/** All memes for these moods (plus the 'any' ones), with {pct} filled in. */
export function pool(moods, pct = 0) {
  const fill = s => s.replace('{pct}', `${Math.round(pct * 100)}%`)
  return MEMES.filter(m => m.mood === 'any' || moods.includes(m.mood)).map(m => ({ ...m, top: fill(m.top), bottom: fill(m.bottom) }))
}
