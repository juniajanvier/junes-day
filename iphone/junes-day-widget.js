// June's Day: iPhone home screen widget for Scriptable (free app)
// Shows today's progress from Life_Tracker: cat mood, score, habits, tasks, focus sessions (laptop + Terminal).
// Works in small and medium widget sizes. Tap opens your Habit Log.

const ENDPOINT = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
const KEY = "YOUR_WIDGET_KEY";
const HABIT_LOG = "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit";
const TASK_GOAL = 3;
const FOCUS_GOAL = 4;

const C = {
  bg1: new Color("#3a2430"), bg2: new Color("#2a1a22"), cream: new Color("#fcf4e8"),
  gold: new Color("#e2bd85"), blush: new Color("#e9b9a8"), muted: new Color("#bfa8b2"), track: new Color("#4a2e3e")
};

function today() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

async function load() {
  const r = new Request(ENDPOINT + "?key=" + encodeURIComponent(KEY) + "&date=" + today());
  r.timeoutInterval = 20;
  return await r.loadJSON();
}

const GROUPS = {
  Body: ["Water", "Walk", "Stretched", "Workout", "Sleep"],
  Mind: ["Read", "Pages", "Study", "Language practice", "Bible / prayer", "Wrote"],
  Admin: ["Emails handled", "Texts answered"],
  Health: ["Meds", "Vitamins", "Skincare AM", "Skincare PM"]
};

function habitStatus(d) {
  const H = d.habits.headers, R = d.habits.row || [], T = d.targets;
  const val = n => { const i = H.indexOf(n); return i < 0 ? "" : R[i]; };
  const num = n => { const v = parseFloat(val(n)); return isNaN(v) ? 0 : v; };
  const yes = n => val(n) === true;
  const vi = H.indexOf("Vitamins");
  const meds = [R[vi - 3], R[vi - 2], R[vi - 1]].every(x => x === true);
  const s = {
    "Water": num("Water (oz)") >= T.waterOz, "Walk": num("Walk (min)") >= T.walkMin, "Stretched": yes("Stretched"),
    "Workout": !!val("Workout") && val("Workout") !== "Rest day", "Sleep": num("Sleep (hrs)") >= T.sleepHrs,
    "Read": yes("Read"), "Pages": num("Pages read") >= T.pages, "Study": num("Study min (auto)") > 0,
    "Language practice": yes("Language practice"), "Bible / prayer": yes("Bible / prayer"), "Wrote": yes("Wrote"),
    "Emails handled": yes("Emails handled"), "Texts answered": yes("Texts answered"),
    "Meds": meds, "Vitamins": yes("Vitamins"), "Skincare AM": yes("Skincare AM"), "Skincare PM": yes("Skincare PM")
  };
  const sc = val("Daily score");
  const all = Object.values(s);
  const habits = typeof sc === "number" ? sc : all.filter(Boolean).length / all.length;
  return { s, habits: Math.max(0, Math.min(1, habits)) };
}

function mood(total) {
  if (total < 0.25) return { face: "😾", name: "Acting up", line: "Pick one small win." };
  if (total < 0.5) return { face: "😼", name: "Restless", line: "A habit or two will settle her." };
  if (total < 0.85) return { face: "😺", name: "Content", line: "Slow blinks. You're on track." };
  return { face: "😻", name: "Purring", line: "Happy to be here." };
}

function bar(stack, frac, w) {
  const ctx = new DrawContext(); ctx.size = new Size(w, 6); ctx.opaque = false; ctx.respectScreenScale = true;
  const p = new Path(); p.addRoundedRect(new Rect(0, 0, w, 6), 3, 3); ctx.addPath(p); ctx.setFillColor(C.track); ctx.fillPath();
  const f = new Path(); f.addRoundedRect(new Rect(0, 0, Math.max(6, w * frac), 6), 3, 3); ctx.addPath(f); ctx.setFillColor(C.gold); ctx.fillPath();
  const img = stack.addImage(ctx.getImage()); img.imageSize = new Size(w, 6);
}

function text(stack, t, size, color, font) {
  const x = stack.addText(t); x.textColor = color; x.font = font || Font.systemFont(size); x.lineLimit = 1; x.minimumScaleFactor = 0.7; return x;
}

async function build() {
  const w = new ListWidget();
  const g = new LinearGradient(); g.colors = [C.bg1, C.bg2]; g.locations = [0, 1]; w.backgroundGradient = g;
  w.setPadding(14, 14, 12, 14);
  w.url = HABIT_LOG;
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

  let d;
  try { d = await load(); } catch (e) { d = { error: "offline" }; }
  if (d.error) {
    text(w, "June's Day", 15, C.cream, new Font("Georgia", 15));
    w.addSpacer(6); text(w, "Can't reach your tracker right now.", 11, C.muted);
    return w;
  }
  const hs = habitStatus(d);
  const task = Math.min(1, d.tasks.done.length / TASK_GOAL);
  const focusN = d.focus ? d.focus.count : 0;
  const focus = Math.min(1, focusN / FOCUS_GOAL);
  const total = d.focus ? 0.5 * hs.habits + 0.3 * task + 0.2 * focus : (0.5 * hs.habits + 0.3 * task) / 0.8;
  const m = mood(total);
  const fam = config.widgetFamily || "medium";

  const top = w.addStack(); top.centerAlignContent();
  const left = top.addStack(); left.layoutVertically();
  text(left, "June's Day", 15, C.cream, new Font("Georgia", 15));
  text(left, new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase(), 9, C.muted, Font.mediumSystemFont(9));
  top.addSpacer();
  text(top, m.face, fam === "small" ? 30 : 34);

  w.addSpacer(6);
  const sr = w.addStack(); sr.bottomAlignContent();
  text(sr, Math.round(total * 100) + "%", 26, C.cream, new Font("Georgia", 26));
  sr.addSpacer(6);
  const mt = sr.addStack(); mt.layoutVertically();
  text(mt, m.name, 12, C.gold, new Font("Georgia-Italic", 12));
  if (fam !== "small") text(mt, m.line, 9.5, C.muted);

  w.addSpacer(6);
  const bw = fam === "small" ? 80 : 120;
  const b1 = w.addStack(); b1.centerAlignContent(); text(b1, "Habits ", 9.5, C.muted); b1.addSpacer(); bar(b1, hs.habits, bw);
  w.addSpacer(3);
  const b2 = w.addStack(); b2.centerAlignContent(); text(b2, "Tasks " + d.tasks.done.length + "/" + TASK_GOAL + " ", 9.5, C.muted); b2.addSpacer(); bar(b2, task, bw);
  if (d.focus) {
    w.addSpacer(3);
    const b3 = w.addStack(); b3.centerAlignContent(); text(b3, "Focus " + focusN + "/" + FOCUS_GOAL + " ", 9.5, C.muted); b3.addSpacer(); bar(b3, focus, bw);
  }

  if (fam !== "small") {
    w.addSpacer(8);
    const gr = w.addStack();
    Object.keys(GROUPS).forEach((k, i) => {
      if (i) gr.addSpacer();
      const items = GROUPS[k]; const done = items.filter(n => hs.s[n]).length;
      const c = gr.addStack(); c.layoutVertically(); c.centerAlignContent();
      text(c, done + "/" + items.length, 12, C.cream, new Font("Georgia", 12));
      text(c, k.toUpperCase(), 8, C.muted, Font.mediumSystemFont(8));
    });
  }
  return w;
}

const widget = await build();
if (config.runsInWidget) Script.setWidget(widget); else await widget.presentMedium();
Script.complete();
