# Spellbound Maze - Magical Spelling Adventure

This is a small browser-based spelling game for kids. The parent supplies a list of words in `words.txt`. The child hears the word (text-to-speech), then navigates the character to pick up the letters in the correct order.

How to run (recommended: run a local HTTP server):

PowerShell (Python):
```powershell
python -m http.server 8000
# then open http://localhost:8000 in your browser
Start-Process 'http://localhost:8000'
```

PowerShell (Node npx http-server):
```powershell
npx http-server . -p 8000
Start-Process 'http://localhost:8000'
```

Usage:
- Edit `words.txt` (one word per line) to provide the spelling list for the child.
- Open the page, set `Retries allowed` (default 1), then click `Start`.
- The word will be spoken aloud. Use the arrow keys to move the blue character and pick letters.
- If the child selects the letters in correct order, a success tune plays and the next word starts.
- If they pick the wrong letter, a beep plays. They can retry until attempts run out, then the game moves to the next word.

Notes:
- This is a light demo using the browser's Web Speech API (speechSynthesis) and WebAudio for sounds. For best results, run in a modern browser (Chrome, Edge, Firefox).
- Because browsers block `fetch()` for `file://` requests, run a local server (instructions above).

Files:
- `index.html` - main page
- `style.css` - styles
- `main.js` - game logic
- `words.txt` - example words list (editable)

Enjoy! If you want a packaged Electron app or mobile build, I can help with next steps.
