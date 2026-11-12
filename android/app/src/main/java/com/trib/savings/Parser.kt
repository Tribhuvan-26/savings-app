package com.trib.savings

import java.math.BigDecimal

// Pure Kotlin, no Android imports, so the unit test runs it on the JVM.

data class Txn(val debit: Boolean, val paise: Long, val merchant: String)

private val I = RegexOption.IGNORE_CASE
private val AMOUNT = Regex("""(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)""", I)
private val DEBIT = Regex("""\b(debited|spent|paid|sent|withdrawn|purchase)\b""", I)
private val CREDIT = Regex("""\b(credited|received|deposited|refunded)\b""", I)
private val IGNORE = Regex("""\b(otp|will be debited|request|requested|reminder|failed|declined)\b""", I)
private const val END = """(?=\s+(?:on|ref|via|upi|avl|a/c|info)\b|[.,;(]|\s*$)"""
private val PAID_TO = Regex("""\b(?:to|at|towards)\s+(?:vpa\s+)?([A-Za-z0-9@&_\- ]{2,40}?)$END""", I)
private val GOT_FROM = Regex("""\b(?:from|by)\s+(?:vpa\s+)?([A-Za-z0-9@&_\- ]{2,40}?)$END""", I)

fun parseSms(sender: String, body: String): Txn? {
    // Banks send from alphanumeric IDs (VM-HDFCBK). A plain phone number can't log a fake payment.
    if (sender.none { it.isLetter() }) return null
    if (IGNORE.containsMatchIn(body)) return null
    val amount = AMOUNT.find(body) ?: return null
    val d = DEBIT.find(body)
    val c = CREDIT.find(body)
    // "debited from A/c ... credited to VPA x" contains both words: the first one wins.
    val debit = when {
        d == null && c == null -> return null
        c == null -> true
        d == null -> false
        else -> d.range.first < c.range.first
    }
    val paise = BigDecimal(amount.groupValues[1].replace(",", "")).movePointRight(2).toLong()
    if (paise <= 0) return null
    val merchant = (if (debit) PAID_TO else GOT_FROM).find(body)?.groupValues?.get(1)?.trim() ?: "Unknown"
    return Txn(debit, paise, merchant)
}

/** Savings set aside for a payment: pct% of it, or round up to the next ₹10 when pct is null. */
fun savingsFor(paise: Long, pct: Int?): Long =
    if (pct != null) paise * pct / 100 else (1000 - paise % 1000) % 1000

fun rupees(paise: Long) = "₹%d.%02d".format(paise / 100, paise % 100)
