#!/bin/sh
# Sleep and wake tests: the decisions and whole sequences on this computer,
# then the firmware configuration checks. No device needed.
set -e
cd "$(dirname "$0")"
mkdir -p build
${CXX:-c++} -std=c++17 -Wall -Wextra -Werror -O1 -o build/sleep_logic_test sleep_logic_test.cpp
./build/sleep_logic_test
${CXX:-c++} -std=c++17 -Wall -Wextra -Werror -Wno-unused-function -Wno-unused-parameter -I ../firmware -I ../engine/stubs -o build/scene_rooms_test scene_rooms_test.cpp
./build/scene_rooms_test
${CXX:-c++} -std=c++17 -Wall -Wextra -Werror -Wno-unused-function -Wno-unused-parameter -I ../firmware -I ../engine/stubs -o build/app_mode_test app_mode_test.cpp
./build/app_mode_test
python3 check_config.py
