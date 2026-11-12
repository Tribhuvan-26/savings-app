# Savings

An Android app that reads bank/UPI SMS, logs every transaction on the phone, and after each payment saves money to a savings jar, warns you near your budget, and optionally copies the row to a Google Sheet.

- **UI:** React + Vite (`src/`), red/white maximalist design. Real data only: the Android app reads bank SMS automatically (live, plus the last 180 days of inbox history on first launch). A plain browser shows the layout with no data.
- **App shell:** Capacitor (`android/`)
- **SMS reading:** native Kotlin in `android/app/src/main/java/com/trib/savings/`
  - `Parser.kt`: reads amount, debit/credit and merchant from the SMS text
  - `Ledger.kt`: SMS receiver, on-device CSV log, notifications, sheet copy
  - `LedgerPlugin.kt`: bridge the React UI calls (`src/data.jsx`)

## Preview the layout in a browser (no data)
```
npm install
npm run dev
```

## Run on your Android phone
1. Install Android Studio.
2. Run `npm run build` and then `npx cap sync android`.
3. Run `npx cap open android`, connect your phone (with USB debugging on), and press Run.
4. Allow the SMS and notification permissions.

After you change the UI, repeat step 2 before running the app again.

Google Play doesn't allow SMS-reading apps, so install it directly from Android Studio.

## Optional: Google Sheet
In a sheet, go to Extensions → Apps Script and paste:
```js
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  SpreadsheetApp.getActiveSheet().appendRow([new Date(d.time), d.type, d.amount, d.merchant, d.saved]);
  return ContentService.createTextOutput("ok");
}
```
Deploy → New deployment → Web app, with access set to "Anyone". Paste the URL into the app's Settings page.
