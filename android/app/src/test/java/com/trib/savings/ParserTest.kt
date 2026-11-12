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

    @Test fun idbiAtmWithdrawal() = assertEquals(
        Txn(true, 100000, "ATM cash", 51529),
        p("IDBI Bank A/c NN1234 debited for INR 1000; ATM WDL. Bal INR 515.29 (incl. of uncleared chqs) as of 10NOV 07:46hrs. If card not used by you, call 1800226999 reference", "AD-IDBIBK"))

    @Test fun idbiUpiPayeeBeforeCredited() {
        val tail = " credited. UPI:000000000001. To Block UPI send SMS UPIBLOCK <Mob. No> to 07799726511  or call 18002094324-IDBI Bank"
        assertEquals(Txn(true, 1000, "SK FOODIES", 57529),
            p("IDBI Bank Acct XX234 debited for Rs 10.00 on 10-Nov-26; Bal Rs 575.29 SK FOODIES$tail", "AX-IDBIBK-S"))
        assertEquals(Txn(true, 4100, "L and T METRO R", 486329),
            p("IDBI Bank Acct XX234 debited for Rs 41.00 on 04-Nov-26; Bal Rs 4863.29 L and T METRO R$tail", "AD-IDBIBK-S"))
    }

    @Test fun idbiUpiCredit() = assertEquals(
        Txn(false, 10000, "ACME STORES", 59429),
        p("Dear Customer, Acct XX234 is credited with Rs 100.00 on 06-Nov-26 from ACME STORES. UPI:000000000002 Avl Bal Rs 594.29-IDBI Bank", "VM-IDBIBK-S"))

    @Test fun idbiShortCreditIsNotFromYou() = assertEquals(
        Txn(false, 200000, UNKNOWN, 255629),
        p("IDBI Bank A/c NN21234 credited for INR 2000.00 thru UPI. Bal INR 2556.29 (incl. of chq in clg) as of 09 NOV 19:09hr. If not used by you, call 18002094324", "AD-IDBIBK-S"))

    @Test fun balances() {
        fun bal(sender: String, body: String) = parseSms(sender, body)?.balance
        assertEquals(57529L, bal("AX-IDBIBK-S", "IDBI Bank Acct XX234 debited for Rs 10.00 on 10-Nov-26; Bal Rs 575.29 SK FOODIES credited. UPI:1"))
        assertEquals(51529L, bal("JM-IDBIBK-S", "IDBI Bank A/c NN1234 debited for INR 1000; ATM WDL. Bal INR 515.29 (incl. of uncleared chqs) as of 10NOV"))
        assertEquals(555629L, bal("AD-IDBIBK-S", "Dear Customer, Acct XX234 is credited with Rs 1000.00 on 09-Nov-26 from ACME. UPI:1 Avl Bal Rs 5556.29-IDBI Bank"))
        assertEquals(87700L, bal("JD-JIOPBS-S", "A/c x1111 credited with Rs. 500.00 on 12-Nov-2026. Bal: Rs. 877. - JPBL"))
        assertEquals(23700L, bal("JD-FAMPAY-S", "Rs 1.0 was credited to your account with transaction ID X. Currently, your account balance is Rs 237.0 on FamPay."))
        assertEquals(563394L, bal("AX-UNIONB", "A/c *9999 Debited for Rs.50 on 23-04-2023 by Mob Bk ref no 3479 Avl Bal Rs:5633.94 -Union Bank of India"))
        assertNull(bal("VM-HDFCBK", "Sent Rs.250.00 From HDFC Bank A/C *1234 To RAMESH K On 12/11/26 Ref 123456"))
        assertEquals("IDBIBK", bankOf("AX-IDBIBK-S"))
        assertEquals("UNIONB", bankOf("AX-UNIONB"))
    }

    @Test fun sbi() {
        // Setting up autopay moves no money: ignored. The later debit is the payment.
        assertNull(p("Your UPI-Mandate for Rs.1950.00 is successfully created towards Google Play from A/c No: XXXXXX1234. UMN:abc@ptyes. If not you, kindly report on 18001234. -SBI", "AD-SBIUPI-S"))
        // No "Rs" before the amount, and "Refno" ends the payee name.
        assertEquals(Txn(true, 195000, "Google Play"),
            p("Dear UPI user A/C X1234 debited by 1950.0 on date 12Nov26 trf to Google Play Refno 123456789012. If not u? call 1800111109. -SBI", "AD-SBIUPI-S"))
        assertEquals(Txn(true, 4000, "RAVI KUMAR"),
            p("Dear UPI user A/C X1234 debited by 40.0 on date 12Nov26 trf to RAVI KUMAR Refno 123456789012. If not u? call 1800111109. -SBI", "JD-SBIUPI-S"))
        assertEquals(Txn(false, 50000, UNKNOWN),
            p("Dear SBI UPI User, ur A/cX1234 credited by Rs500 on 12Nov26 by (Ref no 123456789012)", "AD-SBIUPI-S"))
    }

    @Test fun payuGateway() =assertEquals(
        Txn(true, 4100, "L and T METRO RAIL HYDERABA"),
        p("Transaction No. 31761720214 for Rs. 41.00 done for L and T METRO RAIL HYDERABA... has succeeded Team PayU", "AX-PAYUIB-S"))

    @Test fun upiNotifications() {
        assertEquals(Txn(false, 50000, "Rahul Kumar"), parseUpiNotif("₹500 received", "Rahul Kumar paid you ₹500"))
        assertEquals(Txn(false, 50000, "Rahul Kumar"), parseUpiNotif("Rahul Kumar", "paid you ₹500.00"))
        assertEquals(Txn(false, 200000, "A B C Kumar"), parseUpiNotif("Money received", "Received ₹2,000 from A B C Kumar"))
        assertEquals(Txn(false, 2000, "PRIYA SHARMA"), parseUpiNotif("₹20 received from PRIYA SHARMA", "Tap to view"))
        assertEquals(Txn(false, 10000, "Ravi"), parseUpiNotif("Payment received", "You've received ₹100 from Ravi in your bank account"))
        assertNull(parseUpiNotif("Cashback!", "You won ₹5 cashback"))
        assertNull(parseUpiNotif("Payment request", "Ravi requested ₹100 from you"))
        assertEquals(Txn(true, 4000, "Metro"), parseUpiNotif("Sent", "You paid ₹40 to Metro"))
        assertEquals(Txn(true, 19500, "INNOVATIVE RETAIL"), parseUpiNotif("Payment successful", "Paid ₹195 to INNOVATIVE RETAIL"))
        assertEquals(Txn(true, 5600, "L and T Metro Rail"), parseUpiNotif("", "Payment of ₹56 to L and T Metro Rail successful"))
        assertEquals(Txn(true, 4000, "Ravi Teja Kumar"), parseUpiNotif("₹40 sent to Ravi Teja Kumar", "UPI Ref 1234"))
        assertNull(parseUpiNotif("Money added", "₹500 added money to your wallet"))
    }

    @Test fun ignoresOtpRequestsAndPhoneNumbers() {
        assertNull(p("OTP 123456 for txn of Rs 500 at AMAZON"))
        assertNull(p("ABC has requested Rs 200 via UPI collect request"))
        assertNull(p("Sent Rs 500 to you", sender = "+919876543210"))
        assertNull(p("Hey, dinner tonight?"))
        assertNull(p("Hi, a payment of Rs 825 is due on 13-OCT-26 for your Airtel Mobile. To pay via Airtel Thanks App, click https://i.airtel.in/PPpayBills", "AD-AIRBIL-S"))
        assertNull(p("Dear customer, Rs. 100 free cash is credited to your Zepto wallet", "AX-ZEPTON-P"))
        assertNull(p("Thank you for your purchase @ Apollo Pharmacy. Click here to download your bill for Rs.78.26", "AX-APLPHR-S"))
        assertNull(p("We've received consent for annual auto-renewal of Cyber Safe Plan benefits for Rs.199 (inc. GST)", "AX-AIRBNK-S"))
    }

    @Test fun savings() {
        assertEquals(800L, savingsFor(25200, null)) // ₹252 -> round up to ₹260, so save ₹8
        assertEquals(0L, savingsFor(25000, null))
        assertEquals(2500L, savingsFor(50000, 5))
    }
}
