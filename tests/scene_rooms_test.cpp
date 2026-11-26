// Scene rows are room-local now: a "|0+2" tag limits a scene to rooms, and
// no tag means every room. parse_scenes is the one filter — the dialog's
// geometry, its paint and its tap handler all read the same list.
#include <cassert>
#include <cstdio>
#include <string>

#include "remote_ui.h"

using remote_ui::MAX_SCENES;
using remote_ui::Model;
using remote_ui::SceneRow;

static int names_in(const Model &m, std::string *out, int cap) {
  SceneRow rows[MAX_SCENES];
  const int n = remote_ui::parse_scenes(m, &rows);
  for (int i = 0; i < n && i < cap; i++) out[i] = rows[i].name;
  return n;
}

int main() {
  Model m;
  m.scenes = "scene.a|Movie night|0,scene.b|Reading|1,scene.c|All off";
  std::string names[MAX_SCENES];

  // Rooms configured: tagged scenes follow the room, the untagged shows always.
  m.rooms = "Living room|Bedroom";
  m.room_index = 0;
  assert(names_in(m, names, MAX_SCENES) == 2);
  assert(names[0] == "Movie night" && names[1] == "All off");
  m.room_index = 1;
  assert(names_in(m, names, MAX_SCENES) == 2);
  assert(names[0] == "Reading" && names[1] == "All off");

  // Several rooms on one scene.
  m.scenes = "scene.x|Weekend|0+2,scene.y|Nightly|1";
  m.rooms = "A|B|C";
  m.room_index = 2;
  assert(names_in(m, names, MAX_SCENES) == 1);
  assert(names[0] == "Weekend");

  // A tag beyond the room count simply never matches; nothing crashes.
  m.scenes = "scene.x|Ghost|5";
  m.room_index = 0;
  assert(names_in(m, names, MAX_SCENES) == 0);

  // No rooms: tags are moot, everything shows (rooms arrived after scenes).
  m.scenes = "scene.a|A|0,scene.b|B";
  m.rooms = "";
  m.room_index = 0;
  assert(names_in(m, names, MAX_SCENES) == 2);

  // The old format still parses: bare id, id|name.
  m.scenes = "scene.movie_night,scene.all_off|All off";
  assert(names_in(m, names, MAX_SCENES) == 2);
  assert(names[0] == "scene.movie_night");
  assert(names[1] == "All off");

  std::puts("OK: scene room filter, 0 failed");
  return 0;
}
