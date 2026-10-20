# game-table: the "real table" look for the board game sites

Two small files, `table.css` + `table.js` (~33 KB together, no dependencies), make a game look like
real cards and pieces on a real table: felt / wood / cloth surfaces, real-ratio cards with paper
sheen and printed backs, decks whose thickness tracks the count, messy discard piles, held hands
fanned at the bottom edge, opponents' seats round the far side, chips, coins, gems, cubes, meeples,
pawns, dice, dials, tokens and markers. All art is original CSS gradients + tiny generated SVG noise.
Demo: <https://timothyhadfield.github.io/game-table/demo.html>

## 1. Copy it in

1. Copy `table.css` and `table.js` into your site **unchanged** (`css/` and `js/`).
2. `<link rel="stylesheet" href="css/table.css">` and `<script src="js/table.js"></script>`
   (classic script setting `window.TABLE`; `import "./table.js"` also works).
3. Put `class="tbl-surface tbl-felt-green"` (or another surface) on the play area.
4. Load `fx.js` too if the game has it: deals and slides then follow its Animations setting and speed.

## 2. CSS pieces

| Class | What | Variables (defaults on `:root`, override anywhere) |
|---|---|---|
| `.tbl-surface` + `.tbl-felt-green` `.tbl-felt-blue` `.tbl-wood-dark` `.tbl-wood-light` `.tbl-cloth` | table top, texture, warm overhead light, vignette | `--tbl-base`, `--tbl-light`, `--tbl-vig`, `--tbl-tex` |
| `.tbl-card` + `.tbl-poker` `.tbl-bridge` `.tbl-mini` `.tbl-square` `.tbl-tarot` | card blank at real ratio (63/88, 57/89, 44/67, 1/1, 70/120) | `--card-w`, `--ratio`, `--card-paper`, `--card-edge` |
| `.tbl-card.is-lifted` / `.is-up` | bigger shadow (picked up) | |
| `.tbl-back` + `.tbl-lattice` `.tbl-diamonds` `.tbl-sunburst` (+ `.tbl-blue` `.tbl-black` `.tbl-green`) | printed back with white margin | `--back`, `--ink`, `--back-frame` |
| `.tbl-flip` > `.tbl-inner` > `.tbl-face` ×2 | 3-D flip card (`.is-down` = back up) | |
| `.tbl-spot` | dashed empty place on the table | |
| `.tbl-chip.v1` … `.v1000` | casino chip by value (white, red, blue, green, black, purple, gold) | `--chip`, `--spot`, `--chip-size` |
| `.tbl-coin` (`.silver`, `.copper`) | metal coin, text inside | `--metal`, `--metal-d`, `--coin-size` |
| `.tbl-gem` | gem chip (Splendor style) | `--gem`, `--gem-size` |
| `.tbl-cube`, `.tbl-meeple`, `.tbl-pawn`, `.tbl-marker` | wooden pieces | `--piece`, `--size` |
| `.tbl-die` (`.red`, `.black`) | die with pips (fill with `TABLE.die`) | `--die`, `--pip`, `--die-size` |
| `.tbl-dial` | dial with a pointer | `--deg`, `--dial`, `--dial-size` |
| `.tbl-token` | thick cardboard token, text inside | `--tok`, `--tok-ink`, `--tok-size` |
| `.tbl-tilt` | optional: tilt an area away from you, like looking down at a table | |

## 3. JS API

```js
TABLE.pc("10H", { cls })            // HTML for a standard playing card (real pip layouts, two-headed courts)
TABLE.back({ pattern: "lattice" | "diamonds" | "sunburst", cls })   // HTML for a card back
TABLE.card(frontHTML, { down, pattern, cls })                        // HTML for a flippable card
TABLE.deck(el, count, { pattern, cls, badge: true, perCard: .25, max: 14 })  // stack; 0 = dashed spot
TABLE.pile(el, cards, { seed, max: 6, rot: 14, off: 5 })  // face-up pile; jitter is seeded by position, so stable
const h = TABLE.fan(el, cards, { spread: .55, lift: 18, arc: 1, maxRot: 18, multi, backs, across, onPick(i, el, selected) })
//   h.cards, h.layout(), h.select(i, on?), h.selected(); refits on resize; 5–40 cards fit 393 px
//   backs: true = opponent's hand of backs (no picking); across: true = turned to face you
const areas = TABLE.seats(el, [{ name, turn }], { oval: true })   // phone: top strip; >=700px: round the far side
TABLE.chips(el, amount, { denoms, cap: 12 })   // one stack per colour
TABLE.die(el, 1..6); await TABLE.roll(el, value)      // tumble, faces change, lands on value
await TABLE.flip(cardEl, down?)                       // 3-D flip
await TABLE.deal(deckEl, targetEl, { face, pattern, duration })  // ghost card flies deck -> target
await TABLE.slide(cardEl, pileEl)                     // copy of a card glides onto a pile
TABLE.scatter(nodes, seed, { rot: 4, off: 2 })        // small stable tilt so loose pieces aren't square
// pure helpers: deckThickness, stackShadow, fanLayout, seatPositions, chipBreakdown, jitter, rng, hash, PIPXY, animOn
```

Motion uses `transform`/`opacity` only (nothing shifts layout), resolves immediately and does
nothing when the device asks for reduced motion or `FX.settings.animations` is off. `deal` uses
`FX.flyTo` when fx.js is loaded, else its own Web Animations flight.

## 4. Testing

- `npm test` (`node --test test/table.test.mjs`): deck thickness (0 → 0, 52 → 13, capped), stack
  shadow layers, fan fits 5–40 cards at 361 px for 44/56/64 px cards and compresses monotonically,
  symmetric arc, seeded jitter stable and bounded, chip breakdown sums, seat order, pip counts,
  motion gate. Proven able to fail: a mutated copy (no compression, unseeded jitter, no cap) fails 3.
- `demo.html`: every piece on every surface. `?s=wood-dark` picks the surface, `?n=30` the hand
  size, `?sel=3` lifts a card, `?tilt=1` tilts the centre.

## Changelog

- **2026-10-20, 1.0.1:** the flip card no longer relies on `backface-visibility` alone (Playwright
  WebKit ignores it and showed the back face up); faces now swap visibility at the 90° midpoint.
  `flip()` only resolves on the inner card's own transition. Re-copy table.css + table.js.
- **2026-10-20, 1.0.0:** first release. 5 surfaces, cards in 5 ratios, 3 backs, flip, standard
  faces, deck, pile, fan, seats, chips, coins, gems, cubes, meeples, pawns, dice + roll, dial,
  tokens, markers, deal / slide / flip motion.

## This repo

| File | What |
|---|---|
| `table.css`, `table.js` | the kit (copy these) |
| `demo.html` | every piece on every surface |
| `test/table.test.mjs` | node tests |
