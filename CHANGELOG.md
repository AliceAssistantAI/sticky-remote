# Changelog

Each version's first list is what the Sticky shows on its update screen
(short lines, plain characters); web/build.sh puts it in the update manifest.

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
