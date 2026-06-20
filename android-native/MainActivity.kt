package com.universeflow.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(AudioFocusPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
