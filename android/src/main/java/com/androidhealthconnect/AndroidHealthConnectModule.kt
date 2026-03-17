package com.androidhealthconnect

import com.facebook.react.bridge.ReactApplicationContext

class AndroidHealthConnectModule(reactContext: ReactApplicationContext) :
  NativeAndroidHealthConnectSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeAndroidHealthConnectSpec.NAME
  }
}
