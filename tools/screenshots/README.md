# Website screenshots

The screens on the home page (`assets/shots/*.webp`) are the **real Starlit
desktop app**, not mock-ups. To keep them free of anyone else's titles,
artwork, faces, logos or streaming sources, they're captured like this:

* **An empty, separate profile.** Starlit is started with its data, cache,
  temp and home folders pointed at a scratch folder, so it never reads or
  changes a real profile, and with "Continue Without Account":

  ```powershell
  $sbx = 'C:\path\to\scratch'
  $exe = "$env:LOCALAPPDATA\Starlit\Starlit.exe"   # the installed app
  $env:JAVA_TOOL_OPTIONS = "-Dnuvio.dataDir=`"$sbx\data`" -Duser.home=`"$sbx\home`" -Djava.io.tmpdir=`"$sbx\tmp`""
  $env:APPDATA = "$sbx\Roaming"; $env:LOCALAPPDATA = "$sbx\Local"
  & $exe
  ```

  `-Duser.home` also gives it its own single-instance lock, so it runs next to
  an already open Starlit without handing over to it.

* **Made-up content only.** `make_art.py` draws artwork for 16 invented titles
  (abstract skies, planets and skylines in the Starlit palette) and
  `server.py` serves them as a local catalog add-on on `127.0.0.1:7781`
  (`http://127.0.0.1:7781/manifest.json`). No ratings badges, no real
  services. Its single demo "stream" is a still image and never appears on
  the site.
* **Nothing about sources.** Source pickers, debrid and P2P settings are not
  captured; settings views are cropped to the part being shown. The Home
  Airing Now row is turned off (it shows real anime artwork from AniList).
* **No personal data.** The PC remote's pairing screen is not used: its QR
  code and addresses identify a real machine and pairing session.

Then:

```powershell
python -I make_art.py                 # writes img/ and catalog.json
python -I server.py                   # leave running while capturing
.\capture-window.ps1 -Name home -Handle <window handle>   # captures/home.png
python -I export_shots.py             # writes ../../assets/shots/*.webp
```

`export_shots.py` trims the Windows border and title bar, crops the settings
views, and writes each screen at two widths for `srcset`. Recapture after a
release that changes these screens. `img/`, `captures/`, `catalog.json` and
`demo.mp4` are generated and not committed.
