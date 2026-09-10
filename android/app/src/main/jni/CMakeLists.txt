# Custom app-level CMake for the predictive-back scratch app.
#
# Why this file exists at all (see RN docs: "If you wish to customize it, copy
# default-app-setup/CMakeLists.txt into android/app/src/main/jni and point
# externalNativeBuild at it"):
#
# react-native is built from the local checkout, whose VERSION_NAME is 1000.0.0.
# find_package(ReactAndroid CONFIG) therefore exposes ReactAndroid_VERSION_MINOR = 0
# (it is the *minor* component of 1000.0.0, not "1000"). Third-party libraries that
# autolink use that number to decide which compile flags to apply. react-native-screens
# does exactly this in android/src/main/jni/CMakeLists.txt:
#
#     if(ReactAndroid_VERSION_MINOR GREATER_EQUAL 80)
#       target_compile_reactnative_options(${LIB_TARGET_NAME} PRIVATE)
#     else()
#       target_compile_options(... -DLOG_TAG ... -fexceptions -frtti -std=c++20 -Wall)
#     endif()
#
# With minor == 0 the legacy branch is taken, so libreact_codegen_rnscreens.so is
# compiled *without* RN_SERIALIZABLE_STATE. That macro is not cosmetic: it changes
# struct layouts, e.g. react/renderer/core/Props.h
#
#     std::string nativeId;
#     #ifdef RN_SERIALIZABLE_STATE
#       folly::dynamic rawProps = folly::dynamic::object();   // <-- only when defined
#     #endif
#
# so `Props` has two different sizes in the two shared libraries that are linked into
# one process. Both also emit their own WEAK copy of the inline templates in
# react/renderer/core/propsConversions.h; the linker keeps one, and the other library
# calls it through the wrong layout. Verified on the merged libs (same mangled symbol,
# different code size):
#
#     convertRawProp<std::string>      libreactnative.so 504 B   codegen 568 B
#     convertRawProp<folly::dynamic>   libreactnative.so 520 B   codegen 588 B
#
# Result: SIGSEGV reading a garbage pointer inside convertRawProp<std::string>, during
# ComponentDescriptorRegistry::add() at startup -- before any JavaScript runs.
#
# Adding the definitions for the whole app build directory restores a single, consistent
# layout for every non-core native library. Core (libreactnative.so) is compiled by
# ReactAndroid's own CMake invocation and already has both.
cmake_minimum_required(VERSION 3.13)

project(appmodules)

add_compile_definitions(
  RN_SERIALIZABLE_STATE
  HERMES_V1_ENABLED=1
)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)
