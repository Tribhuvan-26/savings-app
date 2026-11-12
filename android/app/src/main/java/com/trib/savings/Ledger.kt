package com.trib.savings

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Telephony
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import androidx.core.app.NotificationManagerCompat
import android.util.Log
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant
import java.time.YearMonth
import java.time.ZoneId
import kotlin.math.abs

/** New SMS, live: log it, notify, copy to the sheet. */
class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        val parts = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
        val sender = parts.firstOrNull()?.originatingAddress ?: return
        val body = parts.joinToString("") { it.messageBody ?: "" }
        val pending = goAsync()
        Thread {
            try { handleSms(ctx.applicationContext, sender, body, System.currentTimeMillis()) } finally { pending.finish() }
        }.start()
    }
}

/**
 * Payments seen in UPI apps' notifications ("Rahul paid you ₹500", "Paid ₹195 to INNOVATIVE RETAIL").
 * Many UPI payments get no bank SMS at all, and IDBI cuts names to 15 letters, so these fill both gaps.
 * Kept in their own file (survives ledger rebuilds) and merged into the ledger on every scan.
 * Needs Notification access (Settings page).
 */
class UpiNotifs : NotificationListenerService() {
    override fun onNotificationPosted(sbn: StatusBarNotification) {
        if (sbn.packageName !in UPI_APPS) return
        val e = sbn.notification.extras
        val text = (e.getCharSequence(Notification.EXTRA_BIG_TEXT) ?: e.getCharSequence(Notification.EXTRA_TEXT) ?: "").toString()
        val t = parseUpiNotif(e.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: "", text) ?: return
        val dc = if (t.debit) "D" else "C"
        synchronized(LOCK) { notifs(this).appendText("${sbn.postTime},${t.paise},${t.merchant.replace(",", " ")},$dc\n") }
    }
}

private val UPI_APPS = setOf(
    "com.phonepe.app", "com.google.android.apps.nbu.paisa.user", "net.one97.paytm", "com.naviapp",
    "com.fampay.in", "in.jfs.jiofinance", "in.amazon.mShop.android.shopping", "in.org.npci.upiapp",
    "com.dreamplug.androidapp", "com.mobikwik_new", "com.snapwork.IDBI",
)

private fun notifs(ctx: Context) = File(ctx.filesDir, "upi_names.csv")

/** Notification payments as (txn, time, id). The id is the line's hash, so a rescan never adds one twice. */
private fun notifTxns(ctx: Context) = synchronized(LOCK) { notifs(ctx).takeIf { it.exists() }?.readLines() ?: emptyList() }
    .mapNotNull { l ->
        val c = l.split(",")
        if (c.size < 3) null else Triple(Txn(c.getOrNull(3) == "D", c[1].toLong(), c[2]), c[0].toLong(), l.hashCode())
    }

/**
 * Display name for a row: a cut-off name ("INNOVATIVE RETA") becomes the shortest longer name that starts
 * with it, from any notification or SMS, so one full sighting fixes that payee's whole history.
 * 12+ letters only, so "RAVI" never becomes "RAVI SHANKAR".
 */
fun namer(ctx: Context, rows: List<Row>): (Row) -> String {
    val pool = (notifTxns(ctx).map { it.first.merchant } + rows.map { it.merchant }).distinct()
    return { r ->
        val m = r.merchant
        if (m.length < 12) m
        else pool.filter { it.length > m.length && it.startsWith(m, ignoreCase = true) }.minByOrNull { it.length } ?: m
    }
}

fun hasNotifAccess(ctx: Context) = NotificationManagerCompat.getEnabledListenerPackages(ctx).contains(ctx.packageName)

/** `id` is the source message's hash: the live receiver and the inbox scan can both see one SMS, it's stored once. */
data class Row(
    val time: Long, val debit: Boolean, val paise: Long, val merchant: String, val saved: Long, val id: Int = 0,
    val bank: String = "", val bal: Long? = null, // account balance after this txn, when the SMS states it
)

private val LOCK = Any()
private val SCAN = Any()
private const val HISTORY_DAYS = 180L
private const val DAY = 86_400_000L
private fun ledger(ctx: Context) = File(ctx.filesDir, "transactions.csv")
fun prefs(ctx: Context) = ctx.getSharedPreferences("settings", Context.MODE_PRIVATE)

fun readRows(ctx: Context): List<Row> = synchronized(LOCK) {
    val f = ledger(ctx)
    if (!f.exists()) return emptyList()
    f.readLines().mapNotNull { line ->
        val c = line.split(",")
        when (c.size) {
            5, 6, 8 -> Row(c[0].toLong(), c[1] == "D", c[2].toLong(), c[3], c[4].toLong(), c.getOrNull(5)?.toIntOrNull() ?: 0,
                c.getOrNull(6) ?: "", c.getOrNull(7)?.toLongOrNull())
            else -> null
        }
    }.sortedBy { it.time }
}

/** You typed the real balance of an account (Budget page). It counts as that account's newest balance. */
fun setBalance(ctx: Context, bank: String, paise: Long) =
    prefs(ctx).edit().putString("bal:$bank", "$paise@${System.currentTimeMillis()}").apply()

/**
 * Latest known balance per bank/wallet: from SMS ("Avl Bal Rs 575.29") or one you typed in, whichever is newer.
 * Accounts silent for 60+ days are skipped as likely unused.
 */
fun accounts(ctx: Context, rows: List<Row>): Map<String, Row> {
    val cutoff = System.currentTimeMillis() - 60 * DAY
    val typed = prefs(ctx).all.filterKeys { it.startsWith("bal:") && it != "bal:$CASH" }.mapNotNull { (k, v) ->
        (v as? String)?.split("@")?.takeIf { it.size == 2 }
            ?.let { Row(it[1].toLong(), false, 0, "", 0, bank = k.removePrefix("bal:"), bal = it[0].toLong()) }
    }
    return (rows.filter { it.bal != null && it.bank.isNotEmpty() } + typed).filter { it.time > cutoff }
        .groupBy { it.bank }.mapValues { (_, g) -> g.maxBy { it.time } }
}

/**
 * Money you have right now: the accounts' latest balances, adjusted by payments logged after all of them that
 * stated no balance (UPI notifications, PayU...). Those happened after every balance we know, so none counts twice.
 */
fun balanceNow(acc: Map<String, Row>, rows: List<Row>): Long? {
    if (acc.isEmpty()) return null
    val since = acc.values.maxOf { it.time }
    return acc.values.sumOf { it.bal!! } +
        rows.filter { it.bal == null && it.bank != CASH && it.time > since }.sumOf { if (it.debit) -it.paise else it.paise }
}

/* ── Cash ──────────────────────────────────────────────────────────────────────────────────────────────
 * An ATM withdrawal isn't spending, it moves money into your pocket. Cash you then spend is typed in by
 * hand (Budget page): those rows are the spending. Kept in cash.csv so ledger rebuilds can't lose them.
 */
const val CASH = "CASH"
private fun cashFile(ctx: Context) = File(ctx.filesDir, "cash.csv")
fun isAtm(r: Row) = r.debit && r.merchant == "ATM cash"

/** Cash in hand: what you last typed in (or 0 at the start of this month), plus ATM withdrawals since, minus cash spent since. */
fun cashNow(ctx: Context, rows: List<Row>): Long {
    val typed = prefs(ctx).getString("bal:$CASH", null)?.split("@")?.takeIf { it.size == 2 }
    val since = typed?.get(1)?.toLong()
        ?: YearMonth.now().atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
    val after = rows.filter { it.time > since }
    return (typed?.get(0)?.toLong() ?: 0) + after.filter(::isAtm).sumOf { it.paise } -
        after.filter { it.bank == CASH }.sumOf { it.paise }
}

/** Money you have right now: bank/wallet balances plus cash in hand. */
fun moneyNow(ctx: Context, rows: List<Row>): Long? = balanceNow(accounts(ctx, rows), rows)?.plus(cashNow(ctx, rows))

/** You spent cash: amount and what on ("chai"). */
fun addCash(ctx: Context, paise: Long, note: String) {
    val line = "${System.currentTimeMillis()},$paise,${note.replace(",", " ").replace("\n", " ").trim().ifEmpty { "Cash spend" }}"
    synchronized(LOCK) { cashFile(ctx).appendText("$line\n") }
    cashTxns(ctx).lastOrNull()?.let { (t, time, id) -> record(ctx, t, time, id, CASH) }
}

/** Undo a typed cash spend (by its time). */
fun deleteCash(ctx: Context, time: Long) = synchronized(LOCK) {
    val f = cashFile(ctx)
    if (f.exists()) f.writeText(f.readLines().filterNot { it.startsWith("$time,") }.joinToString("") { "$it\n" })
    writeRows(ctx, readRows(ctx).filterNot { it.bank == CASH && it.time == time })
}

private fun cashTxns(ctx: Context) = synchronized(LOCK) { cashFile(ctx).takeIf { it.exists() }?.readLines() ?: emptyList() }
    .mapNotNull { l ->
        val c = l.split(",")
        if (c.size < 3) null else Triple(Txn(true, c[1].toLong(), c[2]), c[0].toLong(), "cash$l".hashCode())
    }

/** Spendable this month: your monthly budget if set, but never more than spent so far + what's really in your accounts. */
fun budgetOf(ctx: Context, rows: List<Row>, manual: Long?): Long? {
    val real = moneyNow(ctx, rows)?.plus(spentThisMonth(ctx, rows))
    return listOfNotNull(manual, real).minOrNull()
}

fun spentThisMonth(ctx: Context, rows: List<Row>): Long {
    val self = selfTransfers(ctx, rows)
    return thisMonth(rows).filter { it.debit && it !in self && !isAtm(it) }.sumOf { it.paise }
}

/**
 * Money moved between your own accounts: not spending, not income (balances still move, they come from the SMS).
 * A payee/payer with your name (Settings, "Your name"; IDBI cuts it, so prefixes match), plus the other leg of that
 * transfer: the opposite direction, same amount, within 10 min, nameless or also you.
 */
fun selfTransfers(ctx: Context, rows: List<Row>): Set<Row> {
    val me = norm(prefs(ctx).getString("me", "") ?: "")
    if (me.length < 6) return emptySet()
    fun isMe(name: String) = norm(name).let { it.length >= 6 && (me.startsWith(it) || it.startsWith(me)) }
    val self = HashSet<Row>()
    rows.filter { isMe(it.merchant) }.forEach { r ->
        self += r
        rows.firstOrNull {
            it.debit != r.debit && it.paise == r.paise && abs(it.time - r.time) < 600_000 && (it.merchant == UNKNOWN || isMe(it.merchant))
        }?.let { self += it }
    }
    return self
}

fun thisMonth(rows: List<Row>) = rows.filter {
    YearMonth.from(Instant.ofEpochMilli(it.time).atZone(ZoneId.systemDefault())) == YearMonth.now()
}

private fun norm(s: String) = s.lowercase().filter { it.isLetterOrDigit() }

/** "LandT metro" / "L and T METRO R" / "L and T METRO RAIL HYDERABA": one payee, cut at different lengths. */
private fun samePayee(a: String, b: String) =
    a == UNKNOWN || b == UNKNOWN || norm(a).let { x -> norm(b).let { y -> x.startsWith(y) || y.startsWith(x) } }

/** Store a payment. Returns the row, or null if it's already stored (same id, or the same payment from another source). */
private fun record(ctx: Context, t: Txn, time: Long, id: Int, bank: String): Row? {
    val pct = prefs(ctx).getString("pct", "")?.toIntOrNull()?.coerceIn(0, 100)
    val row = Row(time, t.debit, t.paise, t.merchant.replace(",", " "), if (t.debit) savingsFor(t.paise, pct) else 0, id, bank, t.balance)
    synchronized(LOCK) {
        // ponytail: re-reads the CSV per message; fine for a few thousand rows, keep an id set in memory if it grows
        val rows = readRows(ctx)
        if (rows.any { it.id == row.id }) return null
        // One payment often arrives several ways: IDBI's two SMS, PayU's SMS, a UPI notification. Same direction and
        // amount within 10 min, same payee (or no name) = one payment: keep one row with the fullest name and the balance.
        // ponytail: two real same-amount payments to one payee within 10 min would merge into one
        // Typed cash spends never merge: nothing else reports them, and "₹40 chai" next to a ₹40 UPI is two spends.
        val twin = if (bank == CASH) null else rows.firstOrNull {
            it.debit == row.debit && it.paise == row.paise && abs(it.time - row.time) < 600_000 && samePayee(it.merchant, row.merchant)
        }
        if (twin != null) {
            val name = listOf(twin.merchant, row.merchant).filter { it != UNKNOWN }.maxByOrNull { it.length } ?: UNKNOWN
            val merged = twin.copy(merchant = name, bank = if (twin.bal != null) twin.bank else row.bank, bal = twin.bal ?: row.bal)
            if (merged != twin) writeRows(ctx, rows.map { if (it === twin) merged else it })
            return null // already counted (and notified) as the twin
        }
        ledger(ctx).appendText(line(row))
    }
    return row
}

private fun recordSms(ctx: Context, sender: String, body: String, time: Long) =
    parseSms(sender, body)?.let { record(ctx, it, time, body.hashCode(), bankOf(sender)) }

private fun line(r: Row) = "${r.time},${if (r.debit) "D" else "C"},${r.paise},${r.merchant},${r.saved},${r.id},${r.bank},${r.bal ?: ""}\n"
private fun writeRows(ctx: Context, rows: List<Row>) = ledger(ctx).writeText(rows.joinToString("") { line(it) })

/** Live path. Call off the main thread (it may hit the network). */
fun handleSms(ctx: Context, sender: String, body: String, time: Long): Row? {
    val row = recordSms(ctx, sender, body, time) ?: return null
    val p = prefs(ctx)
    if (row.debit) {
        var msg = "Paid ${rupees(row.paise)} to ${row.merchant}. Saved ${rupees(row.saved)} to jar."
        val rows = readRows(ctx)
        if (isAtm(row)) {
            notify(ctx, "Withdrew ${rupees(row.paise)} → cash in hand. Log what you spend from it in the app.")
            return row
        }
        if (row in selfTransfers(ctx, rows)) {
            notify(ctx, "Moved ${rupees(row.paise)} between your accounts")
            return row
        }
        val budget = budgetOf(ctx, rows, p.getString("budget", "")?.toLongOrNull()?.times(100))
        val spent = spentThisMonth(ctx, rows)
        if (budget != null && spent * 10 >= budget * 8) {
            msg += "\nBudget: ${rupees(spent)} of ${rupees(budget)}" + if (spent > budget) " (OVER!)" else ""
        }
        notify(ctx, msg)
    } else {
        notify(ctx, "Received ${rupees(row.paise)} from ${row.merchant}")
    }
    p.getString("sheet", "")?.takeIf { it.startsWith("https://") }?.let { postToSheet(it, row) }
    return row
}

fun hasSmsAccess(ctx: Context) =
    ctx.checkSelfPermission(Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED

/**
 * Pull bank SMS already in the inbox (first run: last 180 days, then only newer ones), then any UPI notification
 * payments not stored yet. Quiet: no notifications or sheet posts for history.
 */
fun scanInbox(ctx: Context) = synchronized(SCAN) { // one scan at a time, or a rebuild races a scan
    if (!hasSmsAccess(ctx)) return
    val p = prefs(ctx)
    // Parser got smarter: rebuild the ledger from the inbox so old rows get relabelled.
    // ponytail: rows whose SMS was since deleted from the inbox are lost on rebuild
    if (p.getInt("parser", 0) != PARSER_VERSION) synchronized(LOCK) {
        ledger(ctx).delete()
        p.edit().remove("scannedUntil").putInt("parser", PARSER_VERSION).apply()
    }
    val since = p.getLong("scannedUntil", System.currentTimeMillis() - HISTORY_DAYS * DAY)
    var newest = since
    ctx.contentResolver.query(
        Telephony.Sms.Inbox.CONTENT_URI,
        arrayOf(Telephony.Sms.ADDRESS, Telephony.Sms.BODY, Telephony.Sms.DATE),
        "${Telephony.Sms.DATE} > ?", arrayOf(since.toString()),
        "${Telephony.Sms.DATE} ASC",
    )?.use { c ->
        while (c.moveToNext()) {
            val time = c.getLong(2)
            newest = maxOf(newest, time)
            recordSms(ctx, c.getString(0) ?: continue, c.getString(1) ?: continue, time)
        }
    }
    p.edit().putLong("scannedUntil", newest).apply()
    notifTxns(ctx).forEach { (t, time, id) -> record(ctx, t, time, id, "") }
    cashTxns(ctx).forEach { (t, time, id) -> record(ctx, t, time, id, CASH) }
}

private fun notify(ctx: Context, text: String) {
    val nm = ctx.getSystemService(NotificationManager::class.java)
    nm.createNotificationChannel(NotificationChannel("txn", "Transactions", NotificationManager.IMPORTANCE_DEFAULT))
    val n = Notification.Builder(ctx, "txn")
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setContentTitle("Savings")
        .setColor(0xFFE8130C.toInt())
        .setContentText(text)
        .setStyle(Notification.BigTextStyle().bigText(text))
        .build()
    nm.notify(System.currentTimeMillis().toInt(), n)
}

// The CSV is the source of truth. The sheet is a best-effort copy, so a failed post only gets logged.
private fun postToSheet(url: String, r: Row) = try {
    val json = """{"time":${r.time},"type":"${if (r.debit) "debit" else "credit"}","amount":${r.paise / 100.0},""" +
        """"merchant":"${r.merchant.replace("\"", "")}","saved":${r.saved / 100.0}}"""
    (URL(url).openConnection() as HttpURLConnection).run {
        requestMethod = "POST"
        doOutput = true
        setRequestProperty("Content-Type", "application/json")
        outputStream.use { it.write(json.toByteArray()) }
        responseCode.also { disconnect() }
    }
} catch (e: Exception) {
    Log.w("Savings", "sheet post failed", e)
}
