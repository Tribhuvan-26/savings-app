package com.trib.savings

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.os.Build
import android.util.Log
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Self-update: downloads the release APK and installs it through Android's PackageInstaller (the way app stores
 * do), instead of handing it to the browser. Installs from a browser download count as a fresh "unknown source"
 * every time, re-locking restricted settings; a session install by the app itself does not.
 * The user still confirms every update in the system dialog, and Android refuses any APK not signed with our key.
 */
object Updater {
    // Only our own GitHub releases.
    private const val ALLOWED = "https://github.com/Tribhuvan-26/savings-app/releases/download/"

    fun allowed(url: String) = url.startsWith(ALLOWED) && url.endsWith(".apk")

    /** Blocking: call off the main thread. Throws with a readable message on failure. */
    fun downloadAndInstall(ctx: Context, url: String) {
        require(allowed(url)) { "not a Savings release link" }
        val apk = File(ctx.cacheDir, "update.apk")
        download(url, apk)
        val installer = ctx.packageManager.packageInstaller
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
        params.setAppPackageName(ctx.packageName)
        val id = installer.createSession(params)
        installer.openSession(id).use { session ->
            session.openWrite("savings.apk", 0, apk.length()).use { out ->
                apk.inputStream().use { it.copyTo(out) }
                session.fsync(out)
            }
            val flags = PendingIntent.FLAG_UPDATE_CURRENT or
                (if (Build.VERSION.SDK_INT >= 31) PendingIntent.FLAG_MUTABLE else 0)
            val done = PendingIntent.getBroadcast(ctx, id, Intent(ctx, InstallResult::class.java).setPackage(ctx.packageName), flags)
            session.commit(done.intentSender)
        }
    }

    private fun download(url: String, to: File) {
        var conn = URL(url).openConnection() as HttpURLConnection
        // GitHub redirects release downloads to its file host; follow a few hops, https only.
        repeat(5) {
            conn.instanceFollowRedirects = false
            conn.connectTimeout = 15_000
            conn.readTimeout = 30_000
            val code = conn.responseCode
            if (code in 300..399) {
                val next = conn.getHeaderField("Location") ?: error("bad redirect")
                conn.disconnect()
                require(next.startsWith("https://")) { "insecure redirect" }
                conn = URL(next).openConnection() as HttpURLConnection
                return@repeat
            }
            if (code != 200) error("download failed ($code)")
            conn.inputStream.use { input -> to.outputStream().use { input.copyTo(it) } }
            conn.disconnect()
            return
        }
        error("too many redirects")
    }
}

/** PackageInstaller reports back here: show the system "Update this app?" dialog, or log why it failed. */
class InstallResult : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        when (intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)) {
            PackageInstaller.STATUS_PENDING_USER_ACTION -> {
                val confirm = if (Build.VERSION.SDK_INT >= 33) intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)
                else @Suppress("DEPRECATION") intent.getParcelableExtra(Intent.EXTRA_INTENT)
                confirm?.let { ctx.startActivity(it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
            }
            PackageInstaller.STATUS_SUCCESS -> File(ctx.cacheDir, "update.apk").delete()
            else -> Log.w("Savings", "update not installed: " + intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE))
        }
    }
}
