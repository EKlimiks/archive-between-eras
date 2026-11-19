(() => {
  const settingsKey = "archive-between-eras/sound";
  const control = document.getElementById("sound");
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) {
    control.hidden = true;
    return;
  }

  let enabled = false;
  let context;
  try {
    enabled = localStorage.getItem(settingsKey) === "on";
  } catch {
    // The sound preference still works during this session.
  }
  control.setAttribute("aria-pressed", String(enabled));

  function play(kind) {
    if (!enabled) return;
    context ??= new Audio();
    if (context.state === "suspended") void context.resume().catch(() => {});
    if (context.state !== "running") return;

    const now = context.currentTime;
    const voice = context.createOscillator();
    const volume = context.createGain();
    const eraShift = kind === "shift";
    voice.type = eraShift ? "sine" : "triangle";
    voice.frequency.setValueAtTime(eraShift ? 155 : 285, now);
    voice.frequency.exponentialRampToValueAtTime(eraShift ? 540 : 190, now + (eraShift ? .24 : .055));
    volume.gain.setValueAtTime(.0001, now);
    volume.gain.exponentialRampToValueAtTime(eraShift ? .042 : .024, now + .015);
    volume.gain.exponentialRampToValueAtTime(.0001, now + (eraShift ? .32 : .085));
    voice.connect(volume).connect(context.destination);
    voice.start();
    voice.stop(now + (eraShift ? .33 : .09));
  }

  control.addEventListener("click", () => {
    enabled = !enabled;
    control.setAttribute("aria-pressed", String(enabled));
    try {
      localStorage.setItem(settingsKey, enabled ? "on" : "off");
    } catch {
      // No persistence is needed to use sound in this tab.
    }
    if (enabled) play("shift");
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-era-control]")) play("shift");
    else if (event.target.closest(".hotspot, .bench-target, .inventory-item, #room-nav button")) play("tap");
  });

  document.addEventListener("keydown", (event) => {
    if (["1", "2"].includes(event.key) && !document.querySelector("dialog[open]")) play("shift");
  });
})();
