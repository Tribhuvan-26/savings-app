package com.trib.savings

import android.content.Intent
import android.provider.Settings
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * A whole number from JS. PluginCall.getLong only accepts values JSON parsed as Long, so a small number like
 * 40000 (parsed as Int) came back null and every typed amount was rejected.
 */
private fun PluginCall.long(key: String): Long? = (data.opt(key) as? Number)?.toLong()

/** Bridge for the React UI (src/data.jsx). */
@CapacitorPlugin(name = "Ledger")
class LedgerPlugin : Plugin() {
    private val keys = listOf("budget", "goal", "pct", "sheet", "me")

    /** Picks up any bank SMS not yet stored, then returns everything. */
    @PluginMethod
    fun rows(call: PluginCall) {
        Thread { // inbox scan touches the content provider: keep it off the main thread
            scanInbox(context)
            val arr = JSArray()
            val rows = readRows(context)
            val name = namer(context, rows)
            val acc = accounts(context, rows)
            val self = selfTransfers(context, rows)
            val accts = JSArray()
            acc.forEach { (bank, r) ->
                accts.put(JSObject().apply { put("bank", bank); put("bal", r.bal); put("time", r.time) })
            }
            rows.forEach { r ->
                arr.put(JSObject().apply {
                    put("time", r.time)
                    put("debit", r.debit)
                    put("paise", r.paise)
                    put("merchant", name(r))
                    put("saved", if (r in self || isAtm(r)) 0 else r.saved) // no round-up on moving your own money
                    put("self", r in self)
                    put("atm", isAtm(r)) // money into your pocket, not spending
                    put("cash", r.bank == CASH) // a cash spend you typed in (deletable)
                })
            }
            call.resolve(JSObject().apply {
                put("rows", arr)
                put("smsAccess", hasSmsAccess(context))
                put("notifAccess", hasNotifAccess(context))
                put("accounts", accts)
                // Same rule as the budget alert notification (Ledger.kt budgetOf), so the two never disagree.
                put("budget", budgetOf(context, rows, prefs(context).getString("budget", "")?.toLongOrNull()?.times(100)) ?: 0)
                put("balance", moneyNow(context, rows) ?: 0)
                put("cash", cashNow(context, rows))
            })
        }.start()
    }

    /** You spent cash: { paise: 4000, note: "chai" }. */
    @PluginMethod
    fun addCash(call: PluginCall) {
        val paise = call.long("paise")
        if (paise == null || paise <= 0) return call.reject("a positive paise amount needed")
        Thread { addCash(context, paise, call.getString("note", "")!!); call.resolve() }.start()
    }

    /** Undo a typed cash spend: { time }. */
    @PluginMethod
    fun deleteCash(call: PluginCall) {
        val time = call.long("time") ?: return call.reject("time needed")
        Thread { deleteCash(context, time); call.resolve() }.start()
    }

    /** You typed an account's real balance: { bank: "IDBIBK", paise: 30329 }. */
    @PluginMethod
    fun setBalance(call: PluginCall) {
        val bank = call.getString("bank")
        val paise = call.long("paise")
        if (bank.isNullOrBlank() || paise == null || paise < 0) return call.reject("bank and a non-negative paise amount needed")
        setBalance(context, bank, paise)
        call.resolve()
    }

    /** Installed version, for the update check: { version: "1.1.0" }. */
    @PluginMethod
    fun appInfo(call: PluginCall) {
        val v = context.packageManager.getPackageInfo(context.packageName, 0).versionName
        call.resolve(JSObject().apply { put("version", v) })
    }

    /** Open a link (the update APK) in the phone's browser, which downloads it and offers to install. */
    @PluginMethod
    fun openUrl(call: PluginCall) {
        val url = call.getString("url")?.takeIf { it.startsWith("https://github.com/") }
            ?: return call.reject("only GitHub release links")
        context.startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        call.resolve()
    }

    /** Android only lets the user grant notification access from its own settings screen. */
    @PluginMethod
    fun openNotifAccess(call: PluginCall) {
        context.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        call.resolve()
    }

    @PluginMethod
    fun settings(call: PluginCall) {
        val p = prefs(context)
        call.resolve(JSObject().apply { keys.forEach { put(it, p.getString(it, "")) } })
    }

    @PluginMethod
    fun save(call: PluginCall) {
        // Ledger.kt ignores values it can't parse, so junk here can't break the money math.
        prefs(context).edit().apply { keys.forEach { putString(it, call.getString(it, "")!!.trim()) } }.apply()
        call.resolve()
    }
}
