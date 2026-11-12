package com.trib.savings

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ParserTest {
    private fun p(body: String, sender: String = "VM-HDFCBK") = parseSms(sender, body)

    @Test fun upiDebit() = assertEquals(
        Txn(true, 25000, "RAMESH K"),
        p("Sent Rs.250.00 From HDFC Bank A/C *1234 To RAMESH K On 12/11/26 Ref 123456"))

    @Test fun debitAndCreditWordsDebitFirst() = assertEquals(
        Txn(true, 50000, "zomato@hdfcbank"),
        p("Rs 500 debited from A/c XX12 and credited to VPA zomato@hdfcbank on 12Nov26. UPI Ref 1"))

    @Test fun cardSpendWithCommas() = assertEquals(
        Txn(true, 129900, "FLIPKART"),
        p("INR 1,299.00 spent on your SBI Credit Card ending 1234 at FLIPKART on 12/11/26. Avl lmt INR 50,000"))

    @Test fun credit() = assertEquals(
        Txn(false, 1000000, "ACME PAYROLL"),
        p("Your A/c XX12 is credited with ₹10,000.00 by ACME PAYROLL on 01-11-26"))

    @Test fun ignoresOtpRequestsAndPhoneNumbers() {
        assertNull(p("OTP 123456 for txn of Rs 500 at AMAZON"))
        assertNull(p("ABC has requested Rs 200 via UPI collect request"))
        assertNull(p("Sent Rs 500 to you", sender = "+919876543210"))
        assertNull(p("Hey, dinner tonight?"))
    }

    @Test fun savings() {
        assertEquals(800L, savingsFor(25200, null)) // ₹252 -> round up to ₹260, so save ₹8
        assertEquals(0L, savingsFor(25000, null))
        assertEquals(2500L, savingsFor(50000, 5))
    }
}
