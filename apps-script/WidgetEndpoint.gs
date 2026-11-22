// June's Day endpoint (v2, Nov 22, 2026).
// Read: today's Habit Log row, Habit Lists targets, Tracker tasks, focus sessions, last 7 days, next calendar event.
// Write (only these, only with the key): log a focus session, tap a habit, mark a task Done.
// Protected by WIDGET_KEY.
const WIDGET_KEY = 'REPLACE_WITH_A_LONG_RANDOM_KEY';
const FOCUS_SHEET = 'Focus Log';
const FOCUS_TOPICS = ['Study', 'Work', 'Business', 'Real Estate', 'Admin', 'Other'];

function doGet(e) {
  const out = function (o) {
    return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  };
  const p = (e && e.parameter) || {};
  if (p.key !== WIDGET_KEY) return out({ error: 'unauthorized' });
  try {
    const lock = LockService.getScriptLock();
    const action = p.action || 'read';
    if (action !== 'read') {
      lock.waitLock(15000);
      try {
        if (action === 'focus') logFocus_(p);
        else if (action === 'habit') tapHabit_(p);
        else if (action === 'task') markTaskDone_(p);
        else return out({ error: 'unknown action' });
        SpreadsheetApp.flush();
      } finally { lock.releaseLock(); }
    }
    return out(read_(p));
  } catch (err) {
    return out({ error: String(err && err.message || err) });
  }
}

function ctx_(p) {
  const ss = SpreadsheetApp.getActive();
  const tz = ss.getSpreadsheetTimeZone();
  const fmt = function (d) { return (d instanceof Date) ? Utilities.formatDate(d, tz, 'yyyy-MM-dd') : String(d || ''); };
  const date = /^\d{4}-\d{2}-\d{2}$/.test(p.date || '') ? p.date : fmt(new Date());
  return { ss: ss, tz: tz, fmt: fmt, date: date };
}

function habitRow_(c, date) {
  const sh = c.ss.getSheetByName('Habit Log');
  const dates = sh.getRange(5, 1, sh.getLastRow() - 4, 1).getValues();
  for (let i = 0; i < dates.length; i++) if (c.fmt(dates[i][0]) === date) return { sh: sh, row: i + 5 };
  return { sh: sh, row: 0 };
}

function read_(p) {
  const c = ctx_(p);
  const ss = c.ss, today = c.date, fmt = c.fmt;
  // Habit Log row
  const hl = ss.getSheetByName('Habit Log');
  const lastCol = hl.getLastColumn();
  const headers = hl.getRange(4, 1, 1, lastCol).getValues()[0];
  const hr = habitRow_(c, today);
  const row = hr.row ? hl.getRange(hr.row, 1, 1, lastCol).getValues()[0].map(function (v) { return v instanceof Date ? fmt(v) : v; }) : [];
  // Targets
  const lists = ss.getSheetByName('Habit Lists').getRange(4, 2, 20, 2).getValues();
  const t = {}; lists.forEach(function (r) { t[String(r[0])] = r[1]; });
  const targets = { waterOz: Number(t['Water target (oz)']) || 128, walkMin: Number(t['Walk target (min)']) || 90, pages: Number(t['Pages per day target']) || 20, sleepHrs: Number(t['Sleep target (hrs)']) || 8 };
  // Tracker tasks
  const tr = ss.getSheetByName('Tracker').getRange(2, 1, 599, 19).getValues();
  const done = [], dueToday = [], upNext = [];
  let overdue = 0;
  tr.forEach(function (r) {
    if (!r[0]) return;
    const status = String(r[5]), doneOn = fmt(r[18]), due = fmt(r[12]), pri = String(r[6]), type = String(r[4]);
    if (status === 'Done' && doneOn === today) { done.push({ id: r[0], task: r[2] }); return; }
    if (['Done', 'Dropped', 'Parked'].indexOf(status) >= 0 || type === 'Standing') return;
    if (due && due === today) dueToday.push({ id: r[0], task: r[2] });
    else if (due && due < today) overdue++;
    if (due && due <= today) upNext.push({ id: r[0], task: r[2], next: r[3], due: due, pri: pri, late: due < today });
  });
  upNext.sort(function (a, b) { return (a.pri > b.pri ? 1 : a.pri < b.pri ? -1 : 0) || (a.due > b.due ? 1 : -1); });
  // Focus sessions + last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(today + 'T12:00:00'); d.setDate(d.getDate() - i); days.push(Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd')); }
  const fs = ss.getSheetByName(FOCUS_SHEET);
  const focusByDay = {}, minutesByTopic = {};
  let todayCount = 0, todayMin = 0;
  if (fs && fs.getLastRow() > 1) {
    fs.getRange(2, 1, fs.getLastRow() - 1, 5).getValues().forEach(function (r) {
      const d = fmt(r[0]); if (days.indexOf(d) < 0) return;
      focusByDay[d] = (focusByDay[d] || 0) + 1;
      const topic = String(r[3] || 'Other'); minutesByTopic[topic] = (minutesByTopic[topic] || 0) + (Number(r[2]) || 0);
      if (d === today) { todayCount++; todayMin += Number(r[2]) || 0; }
    });
  }
  const scoreCol = headers.indexOf('Daily score');
  const week = days.map(function (d) {
    const h = habitRow_(c, d);
    let score = null;
    if (h.row && scoreCol >= 0) { const v = hl.getRange(h.row, scoreCol + 1).getValue(); score = typeof v === 'number' ? v : null; }
    return { date: d, score: score, focus: focusByDay[d] || 0 };
  });
  // Next calendar event (needs Calendar permission; skipped quietly if not granted)
  let nextEvent = null;
  try {
    const now = new Date(), end = new Date(now.getTime() + 36 * 3600 * 1000);
    const soon = now.getTime() - 5 * 60 * 1000;
    const evs = CalendarApp.getDefaultCalendar().getEvents(now, end).filter(function (ev) { return !ev.isAllDayEvent() && ev.getStartTime().getTime() >= soon; });
    if (evs.length) nextEvent = { title: evs[0].getTitle(), start: evs[0].getStartTime().toISOString() };
  } catch (err) { nextEvent = null; }
  return {
    date: today,
    habits: { headers: headers, row: row },
    targets: targets,
    tasks: { done: done, dueToday: dueToday, overdue: overdue, upNext: upNext.slice(0, 5) },
    focus: { count: todayCount, minutes: todayMin, weekMinutesByTopic: minutesByTopic, topics: FOCUS_TOPICS },
    week: week,
    nextEvent: nextEvent
  };
}

function logFocus_(p) {
  const c = ctx_(p);
  let fs = c.ss.getSheetByName(FOCUS_SHEET);
  if (!fs) {
    fs = c.ss.insertSheet(FOCUS_SHEET);
    fs.getRange(1, 1, 1, 6).setValues([['Date', 'Time', 'Minutes', 'Topic', 'Source', 'Session ID']]).setFontWeight('bold');
    fs.setFrozenRows(1);
    fs.getRange('A:A').setNumberFormat('mmm d, yyyy');
  }
  const id = String(p.id || '');
  if (id && fs.getLastRow() > 1) {
    const ids = fs.getRange(2, 6, fs.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return; // already logged
  }
  const minutes = Math.max(1, Math.min(240, Number(p.minutes) || 25));
  const topic = FOCUS_TOPICS.indexOf(p.topic) >= 0 ? p.topic : 'Other';
  const source = p.source === 'terminal' ? 'Terminal' : p.source === 'phone' ? 'Phone' : 'June\'s Day';
  const time = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/New_York', 'h:mm a');
  const dateVal = Utilities.parseDate(c.date, c.tz, 'yyyy-MM-dd');
  fs.appendRow([dateVal, time, minutes, topic, source, id]);
  fs.getRange(fs.getLastRow(), 1).setNumberFormat('mmm d, yyyy');
  if (topic === 'Study') {
    const ls = c.ss.getSheetByName('Study Log');
    if (ls) {
      const r = Math.max(ls.getLastRow() + 1, 5);
      ls.getRange(r, 1).setValue(dateVal);
      ls.getRange(r, 3).setValue(minutes);
      ls.getRange(r, 4).setValue('Drill');
      ls.getRange(r, 6).setValue('June\'s Day focus timer');
    }
  }
}

function tapHabit_(p) {
  const c = ctx_(p);
  const h = habitRow_(c, c.date);
  if (!h.row) throw new Error('No Habit Log row for ' + c.date);
  const headers = h.sh.getRange(4, 1, 1, h.sh.getLastColumn()).getValues()[0];
  const name = String(p.name || '');
  const adds = { 'Water (oz)': 16, 'Walk (min)': 15, 'Pages read': 5 };
  let col = headers.indexOf(name) + 1;
  if (/^Med [123]$/.test(name)) { const v = headers.indexOf('Vitamins'); col = v - 3 + Number(name.slice(4)); }
  if (col < 1) throw new Error('Unknown habit ' + name);
  const cell = h.sh.getRange(h.row, col);
  if (adds[name] !== undefined) {
    const step = p.undo === '1' ? -adds[name] : adds[name];
    cell.setValue(Math.max(0, (Number(cell.getValue()) || 0) + step));
  } else {
    const v = cell.getValue();
    cell.setValue(!(v === true || v === 'TRUE'));
  }
}

function markTaskDone_(p) {
  const c = ctx_(p);
  const sh = c.ss.getSheetByName('Tracker');
  const ids = sh.getRange(2, 1, 599, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(p.id)) {
      const r = i + 2;
      const recurs = sh.getRange(r, 9).getValue();
      if (recurs) { // recurring rows are never Done; note the finished instance instead
        sh.getRange(r, 6).setValue('In progress');
        const n = sh.getRange(r, 15);
        n.setValue(String(n.getValue() || '') + (n.getValue() ? ' | ' : '') + 'Done ' + c.date + ' (June\'s Day)');
      } else {
        sh.getRange(r, 6).setValue('Done');
        sh.getRange(r, 19).setValue(Utilities.parseDate(c.date, c.tz, 'yyyy-MM-dd'));
      }
      return;
    }
  }
  throw new Error('Task not found: ' + p.id);
}

// Run once from the editor to grant Calendar access for the "next event" line.
function authorizeWidget() { CalendarApp.getDefaultCalendar().getName(); SpreadsheetApp.getActive().getName(); }
