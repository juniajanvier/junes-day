# June Soft Life: Windows Terminal "june" tab.
# Windows Terminal runs this via -EncodedCommand (your PowerShell policy blocks profile scripts, and we left it alone).
# Edit here, then ask Claude to re-encode it into Terminal's settings.

$global:J = @{ e = [char]27 }
function global:jc($hex) { $r=[Convert]::ToInt32($hex.Substring(0,2),16); $g=[Convert]::ToInt32($hex.Substring(2,2),16); $b=[Convert]::ToInt32($hex.Substring(4,2),16); "$([char]27)[38;2;$r;$g;${b}m" }
$global:J.gold = jc 'E2BD85'; $global:J.blush = jc 'E9B9A8'; $global:J.lav = jc 'C79BC9'; $global:J.cream = jc 'FCF4E8'
$global:J.muted = jc '8E7380'; $global:J.sage = jc '9DBF9E'; $global:J.r = "$([char]27)[0m"; $global:J.i = "$([char]27)[3m"

$global:JuneQuotes = @(
  @("Persist. Persist. Persist.", "Octavia Butler"),
  @("You are your best thing.", "Toni Morrison, Beloved"),
  @("Piti piti zwazo fè nich li.", "Pwovèb ayisyen", "Little by little, the bird builds its nest."),
  @("Create dangerously, for people who read dangerously.", "Edwidge Danticat"),
  @("Your silence will not protect you.", "Audre Lorde"),
  @("Dèyè mòn, gen mòn.", "Pwovèb ayisyen", "Beyond the mountains, more mountains."),
  @("Still I rise.", "Maya Angelou"),
  @("There are years that ask questions and years that answer.", "Zora Neale Hurston"),
  @("Men anpil, chay pa lou.", "Pwovèb ayisyen", "With many hands, the load is light."),
  @("Caring for myself is not self-indulgence, it is self-preservation.", "Audre Lorde"),
  @("Nothing can be changed until it is faced.", "James Baldwin"),
  @("Sa w plante, se sa w rekòlte.", "Pwovèb ayisyen", "What you plant is what you harvest."),
  @("If there's a book that you want to read, but it hasn't been written yet, then you must write it.", "Toni Morrison"),
  @("Hold fast to dreams.", "Langston Hughes"),
  @("Lespwa fè viv.", "Pwovèb ayisyen", "Hope keeps us alive."),
  @("It will spring up again by the roots, for they are numerous and deep.", "Toussaint Louverture")
)

function global:Show-JuneQuote([int]$index = -1) {
  $j = $global:J; $q = $global:JuneQuotes
  if ($index -lt 0) { $d = (Get-Date).DayOfYear; $index = ((($d - 322) % $q.Count) + $q.Count) % $q.Count }
  $x = $q[$index]
  Write-Host "  $($j.gold)$($j.i)$($x[0])$($j.r)"
  if ($x.Count -gt 2) { Write-Host "  $($j.muted)$($j.i)$($x[2])$($j.r)" }
  Write-Host "  $($j.muted)- $($x[1])$($j.r)"
}

function global:Show-JuneBanner {
  $j = $global:J
  $hour = (Get-Date).Hour
  $hi = if ($hour -lt 12) { "good morning" } elseif ($hour -lt 17) { "good afternoon" } else { "good evening" }
  $date = (Get-Date).ToString("dddd, MMMM d").ToLower()
  $bat = try { (Get-CimInstance Win32_Battery -ErrorAction Stop | Select-Object -First 1).EstimatedChargeRemaining } catch { $null }
  $batTxt = if ($bat) { "  battery $bat%" } else { "" }
  Write-Host ""
  Write-Host "   $($j.lav) /\_/\ $($j.r)   $($j.cream)$hi, june.$($j.r)"
  Write-Host "   $($j.lav)( o.o )$($j.r)   $($j.muted)$date$batTxt$($j.r)"
  Write-Host "   $($j.lav) > ^ < $($j.r)   $($j.muted)type $($j.gold)glow$($j.muted) for your commands$($j.r)"
  Write-Host ""
  Show-JuneQuote
}

function global:prompt {
  $j = $global:J
  $p = $PWD.Path; if ($p.StartsWith($HOME)) { $p = '~' + $p.Substring($HOME.Length) }
  $t = (Get-Date).ToString('h:mm tt').ToLower()
  "`n$($j.gold)$([char]0x2726) june$($j.r)  $($j.blush)$p$($j.r)  $($j.muted)$t$($j.r)`n$($j.lav)$([char]0x276F)$($j.r) "
}

function global:glow {
  $j = $global:J
  Write-Host ""
  Write-Host "  $($j.gold)your commands$($j.r)"
  @(
    @("focus [min] [topic]", "timer, e.g. focus 45 study (study work biz re admin)"),
    @("today", "today's habits and tasks from your Life_Tracker"),
    @("quote", "a random quote; 'quote -today' for today's"),
    @("meow", "check on the cat"),
    @("tracker", "open Life_Tracker"),
    @("wall", "open your wallpapers folder"),
    @("glow", "this list")
  ) | ForEach-Object { Write-Host ("  {0}{1,-19}{2} {3}" -f $j.blush, $_[0], $j.r, $_[1]) }
}

function global:quote([switch]$today) { if ($today) { Show-JuneQuote } else { Show-JuneQuote (Get-Random -Maximum $global:JuneQuotes.Count) } }

# Finished focus sessions go to the tracker's Focus Log tab (the June's Day widget and phone read it from there).
# If the tracker can't be reached, the session waits in focus-log.js and the widget sends it later.
$global:JuneTopics = [ordered]@{ study = 'Study'; work = 'Work'; biz = 'Business'; business = 'Business'; re = 'Real Estate'; realestate = 'Real Estate'; admin = 'Admin'; other = 'Other' }
function global:Add-JuneFocus([int]$min, [string]$topic) {
  $d = (Get-Date).ToString('yyyy-MM-dd')
  $id = 't' + [DateTimeOffset]::Now.ToUnixTimeMilliseconds() + (Get-Random -Maximum 999)
  try {
    $r = Get-JuneTracker @{ action = 'focus'; source = 'terminal'; id = $id; minutes = $min; topic = $topic }
    if ($r.error) { throw $r.error }
    return @{ synced = $true; count = [int]$r.focus.count }
  } catch {
    try {
      $dir = "C:\Users\Public\Documents\June's Day"
      $jf = [IO.Path]::Combine($dir, "focus-pending.json")
      $list = @()
      if (Test-Path -LiteralPath $jf) { $list = @(Get-Content -LiteralPath $jf -Raw | ConvertFrom-Json) }
      $list = @($list | Where-Object { $_.date -ge (Get-Date).AddDays(-14).ToString('yyyy-MM-dd') }) + @([pscustomobject]@{ id = $id; date = $d; minutes = $min; topic = $topic })
      $json = ConvertTo-Json @($list) -Compress -Depth 3
      Set-Content -LiteralPath $jf -Value $json -Encoding UTF8
      Set-Content -LiteralPath ([IO.Path]::Combine($dir, "focus-log.js")) -Value "window.JUNE_TERMINAL_PENDING = $json;" -Encoding UTF8
    } catch {}
    return @{ synced = $false }
  }
}

function global:focus([int]$min = 25, [string]$topic = 'other') {
  $j = $global:J; $total = $min * 60; $start = Get-Date; $w = 30
  $t = $global:JuneTopics[$topic.ToLower() -replace '[^a-z]', '']
  if (-not $t) { Write-Host "  $($j.muted)topics: study, work, biz, re, admin, other. using other.$($j.r)"; $t = 'Other' }
  Write-Host "  $($j.gold)focus$($j.r) $($j.muted)$min min on $t. ctrl+c to stop.$($j.r)"
  try {
    while ($true) {
      $left = $total - [int]((Get-Date) - $start).TotalSeconds
      if ($left -le 0) { break }
      $done = [int]($w * (1 - $left / $total))
      $bar = ([string][char]0x2588 * $done) + ([string][char]0x2591 * ($w - $done))
      $m = [math]::Floor($left / 60); $s = $left % 60
      Write-Host -NoNewline ("`r  {0}{1}{2}  {3}{4:00}:{5:00}{6} " -f $j.gold, $bar, $j.r, $j.cream, $m, $s, $j.r)
      Start-Sleep -Milliseconds 500
    }
    Write-Host ("`r  {0}{1}{2}  {3}done. well done, june.{4}       " -f $j.gold, ([string][char]0x2588 * $w), $j.r, $j.sage, $j.r)
    $res = Add-JuneFocus $min $t
    if ($res.synced) { Write-Host "  $($j.muted)focus #$($res.count) today, logged to your tracker and june's day.$($j.r)" }
    else { Write-Host "  $($j.muted)saved. it'll sync to your tracker when june's day is open and online.$($j.r)" }
    try { (New-Object System.Media.SoundPlayer "C:\Users\Public\Music\June Sounds\June Focus Done.wav").PlaySync() } catch { [console]::Beep(880, 400) }
  } finally { Write-Host "" }
}

function global:Get-JuneTracker([hashtable]$extra = @{}) {
  $cfg = Get-Content "C:\Users\Public\Documents\June's Day\config.js" -Raw
  $ep = [regex]::Match($cfg, 'endpoint:\s*"([^"]+)"').Groups[1].Value
  $key = [regex]::Match($cfg, 'key:\s*"([^"]+)"').Groups[1].Value
  $d = (Get-Date).ToString('yyyy-MM-dd')
  $qs = "key=$([uri]::EscapeDataString($key))&date=$d"
  foreach ($k in $extra.Keys) { $qs += "&$k=$([uri]::EscapeDataString([string]$extra[$k]))" }
  Invoke-RestMethod -Uri "$($ep)?$qs" -TimeoutSec 30
}

function global:today {
  $j = $global:J
  try { $d = Get-JuneTracker } catch { Write-Host "  $($j.muted)can't reach your tracker right now.$($j.r)"; return }
  if ($d.error) { Write-Host "  $($j.muted)tracker said: $($d.error)$($j.r)"; return }
  $h = @($d.habits.headers); $row = @($d.habits.row)
  $i = [array]::IndexOf($h, 'Daily score'); $score = if ($i -ge 0 -and $row.Count -gt $i -and $row[$i] -is [ValueType]) { [double]$row[$i] } else { 0 }
  $tasks = @($d.tasks.done).Count
  $bar = { param($f) $n = [int](20 * [math]::Min(1.0, [math]::Max(0.0, [double]$f))); ([string][char]0x2588 * $n) + ([string][char]0x2591 * (20 - $n)) }
  Write-Host ""
  Write-Host ("  {0}habits {1}{2}{3}  {4}%" -f $j.cream, $j.gold, (& $bar $score), $j.r, [int]($score * 100))
  Write-Host ("  {0}tasks  {1}{2}{3}  {4}/3 done" -f $j.cream, $j.gold, (& $bar ($tasks / 3)), $j.r, $tasks)
  if ($d.focus) { $fc = [int]$d.focus.count; Write-Host ("  {0}focus  {1}{2}{3}  {4}/4, {5} min" -f $j.cream, $j.gold, (& $bar ($fc / 4)), $j.r, $fc, [int]$d.focus.minutes) }
  if ($d.nextEvent) { $st = [datetime]$d.nextEvent.start; Write-Host "  $($j.muted)next: $($d.nextEvent.title) at $($st.ToLocalTime().ToString('h:mm tt').ToLower())$($j.r)" }
  if ($d.tasks.dueToday) { @($d.tasks.dueToday) | Select-Object -First 5 | ForEach-Object { $n = if ($_.task) { $_.task } elseif ($_.Task) { $_.Task } else { "$_" }; Write-Host "  $($j.blush)- $n$($j.r)" } }
  if ($d.tasks.overdue) { Write-Host "  $($j.muted)$($d.tasks.overdue) overdue, gently.$($j.r)" }
}

function global:meow {
  $j = $global:J
  $moods = @(
    @(" /\_/\ ", "( -.- )", " > ~ < ", "she's napping on your keyboard."),
    @(" /\_/\ ", "( o.o )", " > ^ < ", "slow blink. you're doing fine."),
    @(" /\_/\ ", "( ^.^ )", " > v < ", "purring. happy to be here."),
    @(" /\_/\ ", "( o.O )", " > - < ", "knocked your tea over. pick one small win.")
  )
  $m = $moods[(Get-Random -Maximum $moods.Count)]
  Write-Host ""; Write-Host "   $($j.lav)$($m[0])$($j.r)"; Write-Host "   $($j.lav)$($m[1])$($j.r)   $($j.cream)$($m[3])$($j.r)"; Write-Host "   $($j.lav)$($m[2])$($j.r)"
}

function global:tracker { Start-Process "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit" }
function global:wall { Start-Process explorer.exe "$HOME\Pictures\Wallpapers" }

$Host.UI.RawUI.WindowTitle = "june"
Show-JuneBanner
