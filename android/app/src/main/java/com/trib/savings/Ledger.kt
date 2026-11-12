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
import android.util.Log
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant
import java.time.YearMonth
import java.time.ZoneId

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

/** `id` is the SMS body hash: the live receiver and the inbox scan can both see one message, it's stored once. */
data class Row(val time: Long, val debit: Boolean, val paise: Long, val merchant: String, val saved: Long, val id: Int = 0)

private val LOCK = Any()
private const val HISTORY_DAYS = 180L
private fun ledger(ctx: Context) = File(ctx.filesDir, "transactions.csv")
fun prefs(ctx: Context) = ctx.getSharedPreferences("settings", Context.MODE_PRIVATE)

fun readRows(ctx: Context): List<Row> = synchronized(LOCK) {
    val f = ledger(ctx)
    if (!f.exists()) return emptyList()
    f.readLines().mapNotNull { line ->
        val c = line.split(",")
        when (c.size) {
            5, 6 -> Row(c[0].toLong(), c[1] == "D", c[2].toLong(), c[3], c[4].toLong(), c.getOrNull(5)?.toIntOrNull() ?: 0)
            else -> null
        }
    }.sortedBy { it.time }
}

fun thisMonth(rows: List<Row>) = rows.filter {
    YearMonth.from(Instant.ofEpochMilli(it.time).atZone(ZoneId.systemDefault())) == YearMonth.now()
}

/** Parse and store. Returns the row, or null if it's not a transaction or already stored. */
private fun record(ctx: Context, sender: String, body: String, time: Long): Row? {
    val t = parseSms(sender, body) ?: return null
    val pct = prefs(ctx).getString("pct", "")?.toIntOrNull()?.coerceIn(0, 100)
    val row = Row(time, t.debit, t.paise, t.merchant.replace(",", " "), if (t.debit) savingsFor(t.paise, pct) else 0, body.hashCode())
    synchronized(LOCK) {
        // ponytail: re-reads the CSV per message; fine for a few thousand rows, keep an id set in memory if it grows
        if (readRows(ctx).any { it.id == row.id }) return null
        ledger(ctx).appendText("${row.time},${if (row.debit) "D" else "C"},${row.paise},${row.merchant},${row.saved},${row.id}\n")
    }
    return row
}

/** Live path. Call off the main thread (it may hit the network). */
fun handleSms(ctx: Context, sender: String, body: String, time: Long): Row? {
    val row = record(ctx, sender, body, time) ?: return null
    val p = prefs(ctx)
    if (row.debit) {
        var msg = "Paid ${rupees(row.paise)} to ${row.merchant}. Saved ${rupees(row.saved)} to jar."
        val budget = p.getString("budget", "")?.toLongOrNull()?.times(100)
        val spent = thisMonth(readRows(ctx)).filter { it.debit }.sumOf { it.paise }
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
 * Pull bank SMS already in the inbox (first run: last 180 days, then only newer ones).
 * Quiet: no notifications or sheet posts for history.
 */
fun scanInbox(ctx: Context) {
    if (!hasSmsAccess(ctx)) return
    val p = prefs(ctx)
    val since = p.getLong("scannedUntil", System.currentTimeMillis() - HISTORY_DAYS * 86_400_000L)
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
            record(ctx, c.getString(0) ?: continue, c.getString(1) ?: continue, time)
        }
    }
    p.edit().putLong("scannedUntil", newest).apply()
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
