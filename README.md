# Leonida Trophy Guide — GTA VI Platinum Tracker

An offline guide and tracker for all **55 official GTA VI PlayStation 5 trophies**
(1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden). A static web app — open
`app/index.html` in a browser, no network needed.

## What it does

- **Checklist** of all 55 trophies with official name, description and grade,
  saved in the browser (localStorage), with **export + import** of progress.
- **Filters** by kind (story, side strands, activities, collectibles, combat &
  crime, money, misc, completion) and by grade, plus search and hide-earned.
- **Spoiler setting**: hides the names/descriptions of un-earned story trophies
  until they are earned (or the setting is turned off).
- **Roadmap to the platinum** in 5 stages, built from the official descriptions.
- **10 missable trophies flagged**, each with its one-shot set-up explained.
- **A guide for every trophy, in our own words**, citing its sources
  (Exophase for names/descriptions/grades, PSNProfiles for PSN targets).
  Where the official description does not pin down a place or step, the guide
  says so instead of inventing a verified location.

## Honesty note

Names, descriptions and grades are PlayStation's own words, as listed by
Exophase and PSNProfiles (frozen 2026-11-18). Guide text is written for this
entry from the official descriptions plus general GTA knowledge — never copied
from another guide. No Rockstar logo or official artwork is used.

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output dir and writes
`dossier.json` with the vendored `vendor/makefun-frontend.ts` (kit copy,
unchanged).

## License

MIT — see LICENSE.
