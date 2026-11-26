# Changelog

Each version's first list is what the Sticky shows on its update screen
(short lines, plain characters); web/build.sh puts it in the update manifest.

## 0.8.5

- Scenes follow the room: the setup page remembers which rooms each scene belongs to, and the light card only shows the scenes that live in the room you are in.

## 0.8.4

- AI button: a quick press sleeps, holding 5 seconds powers the device off; powering back on returns to the Launcher.
- Installed from the Launcher app? The update notice now points to the Launcher, and the app no longer tries to install updates itself.

### Details

- Before, a held AI button put the Sticky to sleep like a quick press did, and a self-update attempt inside a Launcher slot wrote the "peer" partition, which belongs to a different installed app: the update never took and a random app could lose its install. The Sticky now reads its own partition table: in a Launcher slot the Install button is replaced by the way through the Launcher (delete the app there, add the same URL again: it always serves the newest build), and the OTA target is emptied so even an install started from Home Assistant fails before it touches flash. A Sticky flashed on its own (factory image, no Launcher) keeps in-app updates exactly as before.

## 0.8.3

- Rooms: press and hold the room name at the top and pick another. One Sticky, a profile per room: its TV, its lights.
- Optional room presence: Home Assistant moves the Sticky to wherever its people are. The setup page builds the automations. Pressing the room name always works by hand.

## 0.8.2

- Press and hold a light: a card opens with on/off, a brightness slider (tap where you want it) and your scenes. A quick tap still just toggles.
- The setup page picks the scenes: tick up to six from your Home Assistant; they reach the Sticky over USB.

## 0.8.1

- Rebuilt with the ESPHome release the original firmware used (2026.10.2): the setup page over USB behaves like it does on a factory Sticky.

## 0.8.0

- The remote drives an Android TV now, through the Android TV Remote integration in Home Assistant.
- The app button opens any app the TV can launch; the setup page asks for its name.
- Tapping the position bar hops ten seconds forward or back, since Android TV has no jump-to-position.

## 0.7.3

- The AI button puts it to sleep again after it has dozed with the clock.
- Unplugged while asleep on USB, it keeps the clock going instead of freezing it.
- Asleep during setup, or before it knows the time, it shows the dark face.

## 0.7.2

- Asleep with the clock, a quick press on any button wakes it again.
- The progress bar moves on its own while playing (once a minute).

## 0.7.1

- Updating shows a progress bar, then "Update done" before it restarts.
- An update started from Home Assistant shows on the Sticky too.
- Looks for updates at most every 6 hours, never while asleep.

## 0.7.0

- Updates from the Sticky: tap "Update" in the status bar, read what's new, install.
- Asleep on USB, any button wakes it again.
- A clock while asleep, with the date (can be turned off).
- Wi-Fi and settings are kept across updates.
- Quicker taps: Wi-Fi no longer naps between presses.
- Setup is done from the setup page only (no hotspot).
