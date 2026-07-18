package com.example.win_golden_flutter

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import android.content.Intent
import android.os.Bundle

class MainActivity: FlutterActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // نستخدم هذا الكود لضمان أن النشاط (Activity) لا يحاول إعادة إنشاء نفسه بشكل خاطئ
        // مما يتسبب في بقاء شاشة البداية عالقة
        intent.putExtra("background_mode", "transparent")
        super.onCreate(savedInstanceState)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // إجبار المحرك على التعرف على الطلب الجديد فوراً
        setIntent(intent)
    }
}
