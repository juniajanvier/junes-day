# Setting up June's Day with your own tracker

June's Day expects a Google Sheet with a few tabs and a Google Apps Script web app bound to it. The steps below take about 20 minutes.

## 1. The sheet

Create (or adapt) a Google Sheet with these tabs. Names and header text must match.

**Habit Log**: one row per day starting on row 5, with headers on row 4. Column A holds the date. The widget reads these headers by name:

`Water (oz)`, `Walk (min)`, `Stretched`, `Workout`, `Sleep (hrs)`, `Read`, `Pages read`, `Study min (auto)`, `Language practice`, `Bible / prayer`, `Wrote`, `Emails handled`, `Texts answered`, three medication columns right before `Vitamins`, `Vitamins`, `Skincare AM`, `Skincare PM`, `Daily score`.

Yes/no habits are checkboxes. `Daily score` is a formula that returns a number from 0 to 1.

**Habit Lists**: settings in columns B and C starting on row 4. The endpoint looks for `Water target (oz)`, `Walk target (min)`, `Pages per day target` and `Sleep target (hrs)`.

**Tracker**: one task per row from row 2. Columns used: A ID, C Task, D Next Action, E Type, F Status, G Priority, I Recurs, M Due, O Notes, S Done On.

**Study Log** (optional): focus sessions tagged Study add a row here (A Date, C Minutes, D Session type, F Source).

**Focus Log** is created automatically the first time a session is logged.

## 2. The Apps Script endpoint

1. In the sheet, open **Extensions > Apps Script** and add a file named `WidgetEndpoint.gs`.
2. Paste in `apps-script/WidgetEndpoint.gs`.
3. Replace `REPLACE_WITH_A_LONG_RANDOM_KEY` with a long random string. Keep it private.
4. Pick `authorizeWidget` in the function menu and click **Run** once to grant Sheets and Calendar access.
5. Click **Deploy > New deployment**, type **Web app**, execute as **Me**, access **Anyone**. Copy the web app URL.
6. After later code changes, use **Deploy > Manage deployments > Edit > New version** so the URL stays the same.

The key check is the only gate, so treat the key like a password.

## 3. The widget

1. Copy `widget/config.example.js` to `widget/config.js`.
2. Set `demo: false`, paste the web app URL into `endpoint`, the key into `key`, and your Habit Log link into `habitLogUrl`.
3. Copy the `widget` folder somewhere stable, for example `C:\Users\Public\Documents\June's Day`.
4. Create a shortcut that opens it as an app window:

```
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="file:///C:/Users/Public/Documents/June's%20Day/index.html" --window-size=460,900
```

5. Put a copy of the shortcut in `shell:startup` to open it at sign-in.

## 4. Windows Terminal (optional)

`terminal/june-profile.ps1` adds `focus [min] [topic]`, `today`, `quote`, `meow`, `tracker` and `glow`. It reads the endpoint and key from the widget's `config.js`.

If your PowerShell execution policy blocks profile scripts, run the file through a Terminal profile with `-EncodedCommand`:

```powershell
$src = Get-Content .\terminal\june-profile.ps1 -Raw
[Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($src))
```

Then set the profile command line to `powershell.exe -NoLogo -NoExit -EncodedCommand <that value>`.

## 5. iPhone (optional)

1. Install **Scriptable** from the App Store.
2. Create a new script, paste in `iphone/junes-day-widget.js`, and fill in `ENDPOINT`, `KEY` and `HABIT_LOG`.
3. Add a Scriptable widget to the home screen and choose the script.
