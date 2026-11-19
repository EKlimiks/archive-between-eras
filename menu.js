(() => {
  const menu = go("main-menu");
  const game = go("game-view");
  const start = go("start-game");
  const help = go("help");
  const back = go("back-menu");
  const fullscreen = go("fullscreen");
  const viewStatus = go("view-status");

  function hasProgress() {
    return state.stage > 0 || state.clues.length > 0 || state.inventory.length > 0;
  }

  function updateMenu() {
    const saved = hasProgress();
    const completed = state.stage === chapters.length;
    const progress = go("menu-progress");
    start.textContent = completed ? "Вернуться к делу" : saved ? "Продолжить" : "Открыть дело";
    progress.hidden = !saved;
    progress.textContent = completed
      ? "Дело № 17 закрыто. Итог можно перечитать в архиве."
      : "Сохранение · " + (chapters[state.stage]?.[0] ?? "");
  }

  function switchView(play) {
    menu.hidden = play;
    game.hidden = !play;
    back.hidden = !play;
    help.hidden = !play;
    document.body.dataset.view = play ? "game" : "menu";
    if (!play) updateMenu();
    window.scrollTo(0, 0);
    go(play ? "case-title" : "menu-title").focus({ preventScroll: true });
  }

  function play() {
    if (dialog.open) {
      returnFocus = "#case-title";
      dialog.close();
    }
    switchView(true);
  }

  function prologue(trigger) {
    returnFocus = "#" + trigger;
    const notes = make("div", "prologue-notes");
    for (const [date, text] of [
      ["1986 · Городской архив", "Лида Ветрова собирает письма жителей для городской выставки. Её собственная записка другу тоже попадает в архив. После аварии с водопроводом бумагу отправляют на реставрацию. В описи остаётся только номер дела."],
      ["2086 · Перед открытием", "Выставка «Город говорит» готовится к открытию. Музейный ИИ нашёл обрывок записки, принял его за служебный документ и составил биографию Лиды. Убедительная табличка уже стоит в очереди на печать."],
      ["Твоё задание", "Архивный пульт открывает одни и те же комнаты с разницей в сто лет. Собери письмо по частям, проверь, откуда взялось описание, и реши, что показать первым посетителям."],
    ]) {
      const note = make("section", "prologue-note");
      note.append(make("h3", "eyebrow", date), make("p", "", text));
      notes.append(note);
    }
    show("Пролог", "До открытия выставки", notes,
      button(hasProgress() ? "Продолжить расследование" : "К рабочему столу", "primary", play));
  }

  start.addEventListener("click", () => {
    if (hasProgress()) play();
    else prologue("start-game");
  });
  go("read-prologue").addEventListener("click", () => prologue("read-prologue"));
  back.addEventListener("click", () => switchView(false));
  go("menu-credits").addEventListener("click", () => showCredits("menu-credits"));

  function updateFullscreen() {
    const active = !!document.fullscreenElement || document.body.classList.contains("focus-mode");
    fullscreen.setAttribute("aria-pressed", String(active));
    go("fullscreen-label").textContent = active ? "Выйти из полного экрана" : "На весь экран";
  }

  fullscreen.addEventListener("click", async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {
        viewStatus.textContent = "Для выхода из полноэкранного режима нажми Esc.";
      });
    } else if (document.body.classList.contains("focus-mode")) {
      document.body.classList.remove("focus-mode");
      viewStatus.textContent = "";
    } else {
      try {
        if (!document.fullscreenEnabled) throw new Error("Native fullscreen unavailable");
        await document.documentElement.requestFullscreen();
      } catch {
        document.body.classList.add("focus-mode");
        viewStatus.textContent = "Игра развёрнута в окне браузера.";
      }
    }
    updateFullscreen();
  });

  document.addEventListener("fullscreenchange", updateFullscreen);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || dialog.open) return;
    if (document.body.classList.contains("focus-mode")) {
      document.body.classList.remove("focus-mode");
      updateFullscreen();
    }
  });

  updateMenu();
  updateFullscreen();
})();
