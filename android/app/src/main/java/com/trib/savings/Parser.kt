package com.trib.savings

import java.math.BigDecimal

// Pure Kotlin, no Android imports, so the unit test runs it on the JVM.

/** Bump whenever parsing changes: the app rebuilds its ledger from the inbox. */
const val PARSER_VERSION = 7
const val UNKNOWN = "Unknown"

/** `balance`: what the account holds after this txn, when the SMS says ("Avl Bal Rs 575.29"). */
data class Txn(val debit: Boolean, val paise: Long, val merchant: String, val balance: Long? = null)

private val I = RegexOption.IGNORE_CASE
private val AMOUNT = Regex("""(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)""", I)
private val DEBIT = Regex("""\b(debited|spent|paid|sent|withdrawn|purchase|done for)\b""", I)
// Payment gateways (PayU): "Transaction No. 1 for Rs. 41.00 done for L and T METRO RAIL HYDERABA... has succeeded"
private val DONE_FOR = Regex("""\bdone for\s+([A-Za-z0-9][A-Za-z0-9 .&'-]{1,40}?)(?:\.{2,}|\s+has\b)""", I)
private val CREDIT = Regex("""\b(credited|received|deposited|refunded)\b""", I)
private val IGNORE = Regex("""\b(otp|will be debited|will be refunded|request|requested|reminder|failed|declined|consent|is due|due on|free cash|rewards?|your bill)\b""", I)
// IDBI-style: "...; Bal Rs 575.29 SK FOODIES credited. UPI:..." (the payee sits right before "credited")
private val PAYEE_CREDITED = Regex("""(?:rs\.?|inr|₹)\s*[\d,]+(?:\.\d{1,2})?\s+([A-Za-z][A-Za-z0-9 .&'-]{1,40}?)\s+credited\b""", I)
// "Bal Rs 575.29", "Avl Bal Rs:5633.94", "Bal: Rs. 877.", "account balance is Rs 237.0"
private val BALANCE = Regex("""\b(?:avl\.?\s*)?bal(?:ance)?\b[^\d]{0,15}?([\d,]+(?:\.\d{1,2})?)""", I)
private val ATM = Regex("""\batm\b""", I)
private const val END = """(?=\s+(?:on|ref|via|upi|avl|a/c|info)\b|[.,;(]|\s*$)"""
private val PAID_TO = Regex("""\b(?:to|at|towards)\s+(?:vpa\s+)?([A-Za-z0-9@&_\- ]{2,40}?)$END""", I)
// (?!you\b): IDBI's "If not used by you, call..." is not a sender.
private val GOT_FROM = Regex("""\b(?:from|by)\s+(?:vpa\s+)?(?!you\b)([A-Za-z0-9@&_\- ]{2,40}?)$END""", I)

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
    val paise = toPaise(amount.groupValues[1])
    if (paise <= 0) return null
    // PAYEE_CREDITED first: IDBI's "To Block UPI send SMS..." footer would otherwise match PAID_TO as "Block".
    val merchant = (if (debit) PAYEE_CREDITED.find(body) ?: DONE_FOR.find(body) ?: PAID_TO.find(body) else GOT_FROM.find(body))
        ?.groupValues?.get(1)?.trim()
        ?: if (debit && ATM.containsMatchIn(body)) "ATM cash" else UNKNOWN
    val balance = BALANCE.find(body)?.let { toPaise(it.groupValues[1]) }
    return Txn(debit, paise, merchant, balance)
}

private fun toPaise(s: String) = BigDecimal(s.replace(",", "")).movePointRight(2).toLong()

/** One key per bank/wallet: "AX-IDBIBK-S" and "VM-IDBIBK-S" are both IDBIBK. */
fun bankOf(sender: String) = sender.split('-').maxBy { it.length }.uppercase()

// UPI app notifications. In: "Rahul Kumar paid you ₹500", "Received ₹500 from Rahul Kumar".
// Out: "Paid ₹195 to INNOVATIVE RETAIL", "₹40 sent to Rahul", "Payment of ₹56 to L and T Metro Rail successful".
private const val NAME = """([A-Za-z][A-Za-z .'&]{1,40}?)"""
private const val STOP = """(?=\s*(?:[.,!:]|\s(?:on|via|in|to|for|from|is|was|successful|completed|using)\b|\s*$))"""
private val PAID_YOU = Regex("""$NAME\s+(?:has\s+)?(?:paid|sent)\s+you\b""", I)
private val RECEIVED_FROM = Regex("""\breceived\b.*?\bfrom\s+$NAME$STOP""", I)
private val PAID_TO_NOTIF = Regex("""\b(?:paid|sent|payment|transferred)\b.*?\bto\s+(?!you\b|your\b|bank\b|wallet\b)$NAME$STOP""", I)
private val NOT_A_PAYMENT = Regex("""\b(cashback|rewards?|offer|scratch|win|won|request|requested|collect|failed|declined|pending|otp|add(?:ed)? money)\b""", I)

/** A payment from a UPI app notification (merchant = the other person, full name), or null if it isn't one. */
fun parseUpiNotif(title: String, text: String): Txn? {
    val all = "$title $text"
    if (NOT_A_PAYMENT.containsMatchIn(all)) return null
    val amount = AMOUNT.find(all) ?: return null
    val paise = toPaise(amount.groupValues[1])
    if (paise <= 0) return null
    // Title and text separately first: joined, "₹500 received Rahul paid you" would name "received Rahul".
    val parts = listOf(text, title, all)
    parts.firstNotNullOfOrNull { s -> (PAID_YOU.find(s) ?: RECEIVED_FROM.find(s))?.groupValues?.get(1)?.trim() }
        ?.let { return if (it.equals("you", true)) null else Txn(false, paise, it) }
    return parts.firstNotNullOfOrNull { s -> PAID_TO_NOTIF.find(s)?.groupValues?.get(1)?.trim() }?.let { Txn(true, paise, it) }
}

/** Savings set aside for a payment: pct% of it, or round up to the next ₹10 when pct is null. */
fun savingsFor(paise: Long, pct: Int?): Long =
    if (pct != null) paise * pct / 100 else (1000 - paise % 1000) % 1000

fun rupees(paise: Long) = "₹%d.%02d".format(paise / 100, paise % 100)
