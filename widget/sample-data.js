// Sample day for demo mode (CONFIG.demo = true). Same shape the Apps Script endpoint returns.
(function () {
  const H = ["Date", "Day", "Month", "Water (oz)", "Water goal", "Walk (min)", "Walk goal", "Stretched", "Workout", "Sleep (hrs)", "Bedtime",
    "Read", "Pages read", "Study min (auto)", "Language practice", "Bible / prayer", "Wrote", "Emails handled", "Texts answered",
    "Med 1", "Med 2", "Med 3", "Vitamins", "Skincare AM", "Skincare PM", "Period", "Cycle notes", "Mood (1-5)", "Energy (1-5)", "Mood note",
    "Breakfast", "Lunch", "Dinner", "Snacks / drinks", "Diet", "Ordered food", "Delivery $", "Took Uber", "Uber $", "No-spend day", "Screen time (hrs)", "Daily score", "Notes"];
  const row = H.map(() => "");
  const set = (k, v) => { row[H.indexOf(k)] = v; };
  set("Water (oz)", 64); set("Walk (min)", 45); set("Stretched", true); set("Workout", "Home workout"); set("Sleep (hrs)", 7.5);
  set("Read", true); set("Pages read", 12); set("Study min (auto)", 50); set("Language practice", false); set("Bible / prayer", true);
  set("Wrote", false); set("Emails handled", true); set("Texts answered", false); set("Med 1", true); set("Med 2", true); set("Med 3", false);
  set("Vitamins", true); set("Skincare AM", true); set("Skincare PM", false); set("Daily score", 0.6);
  const day = i => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); };
  const inMin = m => new Date(Date.now() + m * 60000).toISOString();
  window.SAMPLE_DATA = {
    habits: { headers: H, row },
    targets: { waterOz: 128, walkMin: 90, pages: 20, sleepHrs: 8 },
    tasks: {
      done: [{ id: "HOME-06", task: "Reading catch-up" }],
      dueToday: [{ id: "WORK-24", task: "Prep the project review" }],
      overdue: 1,
      upNext: [
        { id: "WORK-24", task: "Prep the project review", pri: "P0", late: false },
        { id: "BB-12", task: "Send workshop proposal", pri: "P1", late: false },
        { id: "HOME-35", task: "Replace smoke detector batteries", pri: "P2", late: true }
      ]
    },
    focus: { count: 2, minutes: 75, weekMinutesByTopic: { "Study": 240, "Business": 95, "Admin": 50 }, topics: ["Study", "Work", "Business", "Real Estate", "Admin", "Other"] },
    week: [6, 5, 4, 3, 2, 1, 0].map((i, n) => ({ date: day(i), score: [0.4, 0.55, 0.7, 0.35, 0.8, 0.65, 0.6][n], focus: [2, 3, 1, 0, 4, 3, 2][n] })),
    nextEvent: { title: "Study group", start: inMin(85) }
  };
})();
