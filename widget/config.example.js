// Copy this file to config.js and fill in your own values.
// config.js is git-ignored so your key never lands in the repo.
const CONFIG = {
  demo: true,            // true = run on sample-data.js, no tracker needed. Set false once your endpoint is deployed.
  endpoint: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
  key: "YOUR_WIDGET_KEY", // same value as WIDGET_KEY in apps-script/WidgetEndpoint.gs
  habitLogUrl: "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit",
  dailyTaskGoal: 3,      // tracker tasks done for a full Tasks bar
  dailyFocusGoal: 4,     // focus sessions for a full Focus bar
  refreshMinutes: 5
};
