package com.trib.savings

import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/** Bridge for the React UI (src/data.jsx). */
@CapacitorPlugin(name = "Ledger")
class LedgerPlugin : Plugin() {
    private val keys = listOf("budget", "goal", "pct", "sheet")

    /** Picks up any bank SMS not yet stored, then returns everything. */
    @PluginMethod
    fun rows(call: PluginCall) {
        Thread { // inbox scan touches the content provider: keep it off the main thread
            scanInbox(context)
            val arr = JSArray()
            readRows(context).forEach { r ->
                arr.put(JSObject().apply {
                    put("time", r.time)
                    put("debit", r.debit)
                    put("paise", r.paise)
                    put("merchant", r.merchant)
                    put("saved", r.saved)
                })
            }
            call.resolve(JSObject().apply {
                put("rows", arr)
                put("smsAccess", hasSmsAccess(context))
            })
        }.start()
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
