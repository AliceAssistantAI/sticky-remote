// The Android TV Remote integration only ever reports the player as "on" or
// "off": an app in front has to read as playing, a launcher as home, and a
// package id has to reshape to something a tile can show.
#include <cassert>
#include <cstdio>
#include <string>

#include "remote_ui.h"

using remote_ui::app_title;
using remote_ui::is_home_app;
using remote_ui::Model;
using remote_ui::Mode;

static int fails = 0;
static void eq(const std::string &got, const std::string &want, const char *what) {
  if (got != want) {
    printf("FAIL %s: got \"%s\", want \"%s\"\n", what, got.c_str(), want.c_str());
    fails++;
  }
}

int main() {
  eq(app_title("com.google.android.youtube.tv"), "Youtube TV", "youtube");
  eq(app_title("com.netflix.ninja"), "Netflix Ninja", "netflix");
  eq(app_title("com.disney.disneyplus"), "Disneyplus", "disney");
  eq(app_title("YouTube"), "YouTube", "friendly name passes through");
  eq(app_title("tv.twitch.android.app"), "TV Twitch", "twitch");

  assert(is_home_app(""));
  assert(is_home_app("com.google.android.apps.tv.launcherx"));
  assert(is_home_app("com.google.android.tvlauncher"));
  assert(is_home_app("com.android.tv"));
  assert(is_home_app("com.google.android.tv.screensaver"));
  assert(!is_home_app("com.google.android.youtube.tv"));

  Model m;
  m.player_state = "on";
  m.app = "com.google.android.youtube.tv";
  assert(m.mode() == Mode::PLAYING);          // androidtv_remote's "on" + app
  m.app = "com.google.android.tvlauncher";
  assert(m.mode() == Mode::IDLE);             // home screen stays "nothing"
  m.app = "";
  assert(m.mode() == Mode::IDLE);
  m.player_state = "playing";
  assert(m.mode() == Mode::PLAYING);
  m.player_state = "off";
  m.app = "com.google.android.youtube.tv";
  assert(m.mode() == Mode::OFF);

  // The idle subtitle shows a readable app, never a package dump.
  m.player_state = "idle";
  m.app = "com.netflix.ninja";
  eq(remote_ui::subtitle(m), "Netflix Ninja", "subtitle");

  if (fails) {
    printf("%d FAILED\n", fails);
    return 1;
  }
  printf("OK: app title, home app, playing mode, 0 failed\n");
  return 0;
}
