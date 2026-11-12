# Savings

An Android app that reads bank/UPI SMS, logs every transaction on the phone, and after each payment saves money to a savings jar, warns you near your budget, and optionally copies the row to a Google Sheet.

## Install (Android)

1. On your phone, open **[the latest release](https://github.com/Tribhuvan-26/savings-app/releases/latest)** and download `savings-x.y.z.apk`.
2. Tap the downloaded file. If Android blocks it, allow **Install unknown apps** for your browser, then tap the file again.
3. If Play Protect warns about an unknown app, tap **More details → Install anyway**. It's flagged because it isn't from the Play Store.

## First-time setup (5 minutes)

1. **Open Savings and allow SMS access.** This is how it reads your bank messages. It picks up the last 6 months by itself.
   - If Android says *"App was denied access"* or *"Restricted setting"*: open phone **Settings → Apps → Savings**, tap **⋮** (top right) → **Allow restricted settings**, confirm, then go back to the app and allow SMS. Android does this for any app installed outside the Play Store.
2. **Settings tab → Your name, as banks show it.** Type your name the way it appears in bank SMS (e.g. `RAHUL KUMAR`). Money to or from this name counts as a self transfer, not spending. Tap **Save settings**.
3. **Settings tab → allow notification access** (the "UPI names off" line). This lets the app read payment notifications from GPay, PhonePe, Paytm and others. Many UPI payments send no bank SMS, and banks cut names short, so this fills both gaps. Turn on **Savings** in the list.
4. **Budget tab → Really in your accounts.** Check each balance. If one is wrong, type the real amount in **Wrong? Type real balance** and tap **Save**. Do this whenever a number drifts.
5. **Budget tab → Cash in hand.** ATM withdrawals go here instead of counting as spending. Type the cash you actually have, then log cash as you spend it (amount + what for → **Log cash spend**).
6. Optional: set a **Monthly cap** and a **Jar goal** in Settings.

### Good to know
- **Your data never leaves your phone.** Transactions, balances and settings are stored only on the device. The only internet use is loading memes and checking GitHub for updates.
- **Updates:** when a new version is out, a banner appears at the top of the app. Tap **Update**, then install the downloaded file. Your data stays.
- **Don't uninstall to update.** Uninstalling deletes your logged cash and settings.
- **Tap any meme** for another one.

## Banks and apps it understands

Amounts and debit/credit are read from most Indian bank SMS. Names are best for the formats below. Anything else may show as **Unknown** until its format is added.

| Source | Example it understands |
|---|---|
| IDBI Bank (UPI paid) | `debited for Rs 10.00 …; Bal Rs 575.29 SK FOODIES credited` |
| IDBI Bank (UPI received) | `credited with Rs 100.00 … from PRIYA SHARMA` |
| IDBI Bank (ATM) | `debited for INR 1000; ATM WDL` → *ATM cash* |
| HDFC Bank (UPI) | `Sent Rs.250.00 From HDFC Bank A/C *1234 To RAMESH K` |
| Credit cards (SBI and similar) | `INR 1,299.00 spent on your … Card … at FLIPKART` |
| Generic UPI | `Rs 500 debited from A/c … credited to VPA zomato@hdfcbank` |
| Jio Payments Bank, FamPay, Union Bank | amount + balance (sender name not in the SMS) |
| PayU payments (e.g. metro) | `Rs. 41.00 done for L and T METRO RAIL …` |
| UPI app notifications | GPay, PhonePe, Paytm, Navi, FamPay, Jio Finance, Amazon Pay, BHIM, CRED, MobiKwik, IDBI app |

Balances are read from `Bal`, `Avl Bal` and `account balance is` lines.

**Your bank shows Unknown?** Send the developer 2–3 of its transaction SMS (hide the account number if you like, but keep the wording exactly). Each new format gets added and arrives in the next update.

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

Google Play doesn't allow SMS-reading apps, so it's shared as an APK (see Install above).

## Publishing an update (developer)
`scripts/release.sh 1.2.0 "what's actually new"` bumps the version, builds the APK signed with the release key in `~/.savings-release`, and creates the GitHub release. Installed apps see it on their next launch.

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
