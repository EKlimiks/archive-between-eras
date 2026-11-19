const key = "archive-between-eras/v2";
const go = (id) => document.getElementById(id);
const dialog = go("overlay");
const body = go("dialog-body");
const years = { past: "1986", future: "2086" };
const records = {
  cover: ["Обложка дела № 17", "1986", "Отправитель: Л. Ветрова.\nПодпись сверена. Служебного номера нет."],
  rules: ["Карточка сортировки", "1986", "Подписанное личное письмо → Л.\nДокумент со служебным номером → С.\nНеопознанная запись → Ч."],
  index: ["Указатель ящиков", "2086", "Л → Личные письма\nС → Служебные записи\nЧ → Черновики"],
  damage: ["Опись повреждений", "2086", "В ящике сохранился только фрагмент ◇. Парный фрагмент остался на столе приёмки в хранилище 1986 года."],
  marks: ["Инструкция реставратора", "1986", "Верхний паз: знак ○, печать приёмки.\nНижний паз: знак ◇, отметка о подшивке.\nПеред сборкой вставить световой фильтр."],
  letter: ["Письмо Лиды Ветровой", "1986", "Закрой окно. Вернусь в субботу. На втором этаже опять пахнет известью после дождя.\nЛида Ветрова\n\nНа обороте штамп «Личное письмо»."],
  sample: ["Исправление в выборке", "2086", "Метка фрагмента «Закрой окно. Вернусь в субботу» исправлена на «Личное письмо»."],
  draft: ["Черновик музейного ИИ", "2086", "Лида Ветрова собиралась вернуться в субботу. Её ждали в лаборатории № 3 на втором этаже."],
  decision: ["Редакционная запись", "2086", "Лаборатория № 3 в письме не упоминается. Точный адрес неизвестен."],
};
const items = {
  folder: ["▤", "Папка дела № 17"], route: ["Л", "Маршрутная карта Л"],
  top: ["○", "Фрагмент с печатью"], bottom: ["◇", "Фрагмент из ящика"],
  filter: ["◐", "Световой фильтр"], original: ["▤", "Оригинал письма"],
  scan: ["▧", "Копия оригинала"], stamp: ["Л", "Метка «Личное»"],
  label: ["▥", "Этикетка экспоната"],
};
const chapters = [
  ["Сортировка", "Возьми папку, прочти карточку и передай папку сортировщику.", "В лаборатории 1986 года осмотри Рабочий стол и Картотеку. Перенеси папку из инвентаря на Сортировщик."],
  ["Розыск", "Доставь маршрутную карту в нужный ящик хранилища 2086 года.", "В хранилище 2086 года прочти указатель на Архивной стойке. Буква на карте подскажет ящик."],
  ["Реставрация", "Найди второй фрагмент и собери письмо на световом столе в 1986 году.", "В хранилище 1986 года проверь Стол приёмки. В мастерской возьми фильтр из Ящика инструментов и найди порядок фрагментов в Шкафу инструкций."],
  ["Примеры", "Отсканируй письмо и исправь метку одного примера в мастерской 2086 года.", "Положи оригинал на Сканер. Перенеси метку на пример, который дословно совпадает с фрагментом письма."],
  ["Проверка", "Возьми копию к терминалу в лабораторию 2086 года. Найди деталь, для которой нет источника.", "Открой Терминал ИИ и прочти черновик. Приложи копию оригинала к утверждению, которого в письме нет."],
  ["Выставка", "Установи этикетку в одну из витрин хранилища 2086 года.", "Выбери, показать ли только письмо или поставить рядом помеченный черновик."],
];
const rooms = {
  lab: {
    label: "Лаборатория",
    past: ["Лаборатория архива", [["desk", "Рабочий стол", "▤"], ["sorter", "Сортировщик", "⊡"], ["catalog", "Картотека", "▥"]]],
    future: ["Музейная лаборатория", [["labExhibit", "Витрина машины", "▧"], ["terminal", "Терминал ИИ", "◉"], ["registry", "Реестр источников", "▥"]]],
  },
  workshop: {
    label: "Мастерская",
    past: ["Реставрационная мастерская", [["toolbox", "Ящик инструментов", "▤"], ["lightTable", "Световой стол", "◐"], ["manual", "Шкаф инструкций", "▥"]]],
    future: ["Цифровая мастерская", [["study", "Учебная витрина", "▧"], ["scanner", "Сканер", "⊡"], ["sampleRack", "Стойка примеров", "▥"]]],
  },
  vault: {
    label: "Хранилище",
    past: ["Хранилище архива", [["receipt", "Стол приёмки", "▤"], ["oldDrawers", "Архивные ящики", "▧"], ["register", "Опись фонда", "▥"]]],
    future: ["Музейное хранилище", [["transcript", "Пульт хранителя", "◉"], ["storage", "Архивная стойка", "▥"], ["display", "Выставочная витрина", "▧"]]],
  },
};
const examples = [
  ["sample14", "Закрой окно. Проверка вентиляции завершена.", "Служебная запись"],
  ["sample17", "Закрой окно. Вернусь в субботу.", "Служебная запись"],
  ["sample22", "Береги себя. Вернусь завтра.", "Личное письмо"],
];
const query = "Закрой окно. Вернусь в воскресенье.";
const claims = [["claimName", "Лида Ветрова"], ["claimDay", "Возвращение в субботу"], ["claimFloor", "Второй этаж"], ["claimRoom", "Лаборатория № 3"]];
const routes = {
  folder: ["sorter"], route: ["storage", "drawerOfficial", "drawerLetters", "drawerNotes"],
  filter: ["lightTable"], top: ["slotTop", "slotBottom"], bottom: ["slotTop", "slotBottom"],
  original: ["scanner"], stamp: ["study", "sample14", "sample17", "sample22"],
  scan: ["terminal", ...claims.map(([id]) => id)], label: ["display", "displaySource", "displayCompare"],
};
const fresh = () => ({
  era: "past", room: "lab", stage: 0, clues: [], inventory: [],
  lit: false, topPlaced: false, bottomPlaced: false, verdict: null,
});

let state = load();
let selected = null;
let drag = null;
let returnFocus = null;

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && Object.hasOwn(rooms, saved.room) && Object.hasOwn(years, saved.era) &&
        Number.isInteger(saved.stage) && saved.stage >= 0 && saved.stage <= chapters.length &&
        Array.isArray(saved.clues) && Array.isArray(saved.inventory)) {
      return { ...fresh(), ...saved,
        clues: [...new Set(saved.clues.filter((id) => Object.hasOwn(records, id)))],
        inventory: [...new Set(saved.inventory.filter((id) => Object.hasOwn(items, id)))],
      };
    }
  } catch {
    // An unavailable or damaged save does not block play.
  }
  return fresh();
}

function make(tag, cls, content) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (content) node.textContent = content;
  return node;
}

function button(label, cls, action) {
  const node = make("button", cls, label);
  node.type = "button";
  if (action) node.addEventListener("click", action);
  return node;
}

function dismissButton(label) {
  const control = button(label, "primary", () => dialog.close());
  control.dataset.dismiss = "";
  return control;
}

function remember(id) {
  if (!state.clues.includes(id)) state.clues.push(id);
}

function status(message) {
  go("inventory-status").textContent = message;
}

function update() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    go("save-status").textContent = "Прогресс сохранён в этом браузере";
  } catch {
    go("save-status").textContent = "Прогресс сохранится до закрытия вкладки";
  }
  render();
}

function navigate(era, room = state.room) {
  state.era = era;
  state.room = room;
  update();
  status(selected ? "В руке: " + items[selected][1] : "Открыто помещение: " + rooms[room][era][0]);
}

function render() {
  const [location, objects] = rooms[state.room][state.era];
  const step = chapters[state.stage];
  document.body.dataset.era = state.era;
  document.body.dataset.room = state.room;
  for (const [era, year] of Object.entries(years)) {
    const path = "assets/" + (state.room === "lab" ? "" : state.room + "-") + year + ".webp";
    const image = go("scene-image-" + era);
    if (image.getAttribute("src") !== path) image.src = path;
  }
  go("location").textContent = location;
  go("case-number").textContent = "Дело № 17 · " + (step?.[0] ?? "Закрыто");
  go("mission-label").textContent = step ? "Текущая задача" : "Расследование завершено";
  go("mission").textContent = step?.[1] ?? "Письмо выставлено. Твоя редакционная запись осталась в архиве.";
  go("hint").textContent = step ? "Подсказка" : "Финал";
  document.querySelectorAll("[data-era-control]").forEach((control) => {
    control.setAttribute("aria-pressed", String(control.dataset.eraControl === state.era));
  });
  go("room-nav").replaceChildren(...Object.entries(rooms).map(([id, room]) => {
    const nav = button(room.label, "room-link", () => {
      navigate(state.era, id);
      document.querySelector('[data-room-nav="' + id + '"]')?.focus({ preventScroll: true });
    });
    nav.dataset.roomNav = id;
    nav.setAttribute("aria-pressed", String(state.room === id));
    return nav;
  }));
  go("steps").replaceChildren(...chapters.map(([label], index) => {
    const node = make("li", state.stage > index ? "complete" : "");
    if (state.stage === index) node.setAttribute("aria-current", "step");
    node.append(make("span", "step-number", state.stage > index ? "✓" : String(index + 1)), make("span", "", label));
    return node;
  }));
  go("hotspots").replaceChildren(...objects.map(([id, name, icon], index) => {
    const target = button("", "hotspot");
    target.dataset.object = id;
    target.dataset.target = id;
    target.style.setProperty("--x", ["24%", "52%", "79%"][index]);
    target.style.setProperty("--y", ["65%", "44%", "43%"][index]);
    const marker = make("span", "marker", icon);
    marker.setAttribute("aria-hidden", "true");
    target.append(marker, make("span", "hotspot-name", name));
    return target;
  }));
  go("clue-count").textContent = state.clues.length;
  go("empty").hidden = state.clues.length > 0;
  go("clues").replaceChildren(...state.clues.map((id) => {
    const [title, era] = records[id];
    const node = make("li");
    const control = button(title, "clue", () => {
      returnFocus = '[data-clue="' + id + '"]';
      record(id);
    });
    control.dataset.clue = id;
    control.append(make("span", "clue-year", era));
    node.append(control);
    return node;
  }));
  go("inventory-empty").hidden = state.inventory.length > 0;
  go("inventory-items").replaceChildren(...state.inventory.map((id) => {
    const [icon, title] = items[id];
    const control = button("", "inventory-item");
    control.dataset.item = id;
    control.style.touchAction = "none";
    const glyph = make("span", "item-icon", icon);
    glyph.setAttribute("aria-hidden", "true");
    control.append(glyph, make("span", "item-name", title));
    return control;
  }));
  renderBench();
  highlights();
}

function renderBench() {
  let rows = [];
  if (state.room === "vault" && state.era === "future" && state.stage === 1) {
    rows = [["drawerOfficial", "С · Служебные", "Ящик"], ["drawerLetters", "Л · Личные", "Ящик"], ["drawerNotes", "Ч · Черновики", "Ящик"]];
  } else if (state.room === "workshop" && state.era === "past" && state.stage === 2) {
    rows = [
      ["lightTable", "Световой стол", state.lit ? "Фильтр установлен" : "Гнездо фильтра", state.lit],
      ["slotTop", "Верхний паз", state.topPlaced ? "○ На месте" : "Пусто", state.topPlaced],
      ["slotBottom", "Нижний паз", state.bottomPlaced ? "◇ На месте" : "Пусто", state.bottomPlaced],
    ];
  } else if (state.room === "workshop" && state.era === "future" && state.stage === 3 && state.inventory.includes("stamp")) {
    rows = examples.map(([id, text, label], index) => [id, "Пример " + (index + 1) + " · " + label, text, id === "sample22"]);
  } else if (state.room === "lab" && state.era === "future" && state.stage === 4 && state.clues.includes("draft")) {
    rows = claims.map(([id, label]) => [id, label, "Проверить по источнику"]);
  } else if (state.room === "vault" && state.era === "future" && state.stage === 5) {
    rows = [["displaySource", "Витрина письма", "Проверенные сведения"], ["displayCompare", "Витрина сравнения", "Письмо и черновик"]];
  }
  const bench = go("room-bench");
  bench.replaceChildren(...rows.map(([id, title, detail, disabled]) => {
    const control = button("", "bench-target");
    control.dataset.target = id;
    control.disabled = Boolean(disabled);
    control.append(make("span", "target-name", title), make("span", "target-detail", detail));
    return control;
  }));
  bench.hidden = rows.length === 0;
}

function canUse(id, target) {
  return routes[id]?.includes(target) ?? false;
}

function highlights() {
  document.querySelectorAll("[data-target]").forEach((node) => {
    node.classList.toggle("drop-ready", !node.disabled && canUse(selected, node.dataset.target));
    node.classList.remove("drop-hover");
  });
  document.querySelectorAll("[data-item]").forEach((control) => {
    control.setAttribute("aria-pressed", String(selected === control.dataset.item));
  });
}

function select(id) {
  selected = selected === id ? null : id;
  highlights();
  status(selected ? "В руке: " + items[selected][1] + ". Выбери подсвеченный объект." : "Предмет возвращён в инвентарь.");
}

function show(kicker, title, ...content) {
  go("dialog-kicker").textContent = kicker;
  go("dialog-title").textContent = title;
  body.replaceChildren(...content);
  if (!dialog.open) dialog.showModal();
  else dialog.querySelector(".close").focus();
}

function take(id) {
  return button("Взять: " + items[id][1], "primary", () => {
    if (!state.inventory.includes(id)) state.inventory.push(id);
    update();
    dialog.close();
    status("В инвентаре: " + items[id][1] + ".");
  });
}

function record(id, parcel) {
  const [title, era, text] = records[id];
  remember(id);
  update();
  const contents = [make("blockquote", "document", text)];
  if (parcel && !state.inventory.includes(parcel)) contents.push(take(parcel));
  show(era + " · Документ", title, ...contents);
}

function detail(title, text, parcel) {
  const contents = [make("p", "", text)];
  if (parcel) contents.push(take(parcel));
  show(years[state.era] + " · " + rooms[state.room][state.era][0], title, ...contents);
}

function announce(title, text) {
  show("Дело № 17 · " + (chapters[state.stage]?.[0] ?? "Закрыто"),
    title, make("p", "", text), dismissButton("Продолжить"));
}

function consume(id, ...replacements) {
  state.inventory = state.inventory.filter((item) => item !== id);
  state.inventory.push(...replacements);
  selected = null;
}

function solve(stage, title, text) {
  state.stage = stage;
  update();
  status(title);
  announce(title, text);
}

function focusNextItem() {
  const control = go("inventory-items").querySelector("button") ?? go("hint");
  control.focus({ preventScroll: true });
}

function useItem(id, target) {
  if (!state.inventory.includes(id)) return;
  if (!canUse(id, target)) {
    status("Здесь некуда положить «" + items[id][1] + "».");
    return;
  }
  switch (id) {
    case "folder":
      if (!state.clues.includes("rules")) {
        status("Сортировщику нужна карточка правил из Картотеки.");
        return;
      }
      consume(id, "route");
      solve(1, "Сортировщик выдал индекс Л", "У письма была подпись и не было служебного номера. Возьми выданную карту в хранилище 2086 года и приложи к нужному ящику.");
      break;
    case "route":
      if (target === "storage") {
        record("index");
        return;
      }
      if (target !== "drawerLetters") {
        status("Считыватель отклонил карту. Сверь букву с указателем ящиков.");
        return;
      }
      consume(id, "bottom");
      remember("damage");
      solve(2, "В ящике сохранилась половина", "Фрагмент со знаком ◇ в инвентаре. В описи указано, что второй лежит на столе приёмки в хранилище 1986 года. Письмо можно собрать на световом столе в мастерской.");
      break;
    case "filter":
      consume(id);
      state.lit = true;
      update();
      status("Стол подсвечен. Определи порядок фрагментов по знакам.");
      focusNextItem();
      break;
    case "top":
    case "bottom": {
      if (!state.lit) {
        status("На тёмном столе разметку не видно. Поставь фильтр.");
        return;
      }
      const top = id === "top";
      if (target !== (top ? "slotTop" : "slotBottom")) {
        status("Знак не совпадает с отметкой паза. Проверь инструкцию в шкафу.");
        return;
      }
      consume(id);
      if (top) state.topPlaced = true;
      else state.bottomPlaced = true;
      if (state.topPlaced && state.bottomPlaced) {
        state.inventory.push("original");
        remember("letter");
        solve(3, "Письмо снова целое", "На обороте виден штамп «Личное письмо». Оригинал появился в инвентаре, а текст сохранился в журнале. Перенеси оригинал на сканер в мастерской 2086 года.");
      } else {
        update();
        status("Фрагмент встал на место. Остался второй.");
        focusNextItem();
      }
      break;
    }
    case "original":
      consume(id, "scan", "stamp");
      update();
      status("Получены копия и метка. Подбери пример для исправления.");
      study();
      break;
    case "stamp":
      if (target === "study") {
        study();
        return;
      }
      if (target !== "sample17") {
        status("Текст этой карточки расходится с письмом. Сверь каждую строку с оригиналом.");
        return;
      }
      consume(id);
      remember("sample");
      solve(4, "Модель изменила ответ", "Фраза «" + query + "» раньше определялась как «" + classify(false) + "», теперь как «" + classify(true) + "». Черновик выставки ждёт на терминале в лаборатории 2086 года.");
      break;
    case "scan":
      if (target === "terminal") {
        record("draft");
        return;
      }
      if (target !== "claimRoom") {
        status("Эта деталь есть в письме. Ищи утверждение без опоры на источник.");
        return;
      }
      consume(id, "label");
      remember("decision");
      solve(5, "Номер лаборатории не подтверждён", "Автор, суббота и второй этаж есть в оригинале. Номер комнаты добавила модель. Отнеси этикетку к выставочному столу хранилища 2086 года.");
      break;
    case "label":
      if (target === "display") {
        showDisplay();
        return;
      }
      consume(id);
      state.verdict = target;
      state.stage = chapters.length;
      update();
      status("Этикетка установлена. Дело закрыто.");
      ending();
      break;
  }
}

function words(text) {
  return new Set(text.toLowerCase().match(/[а-яё]+/gu));
}

function classify(corrected) {
  const terms = words(query);
  const ranked = examples.map(([id, text, label]) => {
    const termsInExample = words(text);
    const common = [...terms].filter((word) => termsInExample.has(word)).length;
    const all = new Set([...terms, ...termsInExample]).size;
    return { label: corrected && id === "sample17" ? "Личное письмо" : label, score: common / all };
  }).sort((left, right) => right.score - left.score);
  return ranked[0].label;
}

function study() {
  const list = make("ol", "evidence");
  for (const [id, text, label] of examples) {
    const row = make("li", "", "«" + text + "»");
    row.append(make("div", "sample-tag", state.stage > 3 && id === "sample17" ? "Личное письмо" : label));
    list.append(row);
  }
  show("2086 · Мастерская", "Учебная выборка",
    make("blockquote", "document", "Запрос: «" + query + "»\nОтвет: «" + classify(state.stage > 3) + "»."),
    make("p", "aside", state.inventory.includes("stamp")
      ? "Примеры доступны под сценой. Поставь метку на запись, которая дословно совпадает с частью письма."
      : "Система берёт метку примера с наибольшей долей общих слов. Для правки сначала отсканируй оригинал."),
    list);
}

function showDisplay() {
  if (state.stage === chapters.length) {
    ending();
  } else {
    detail("Выставочный стол", state.stage === 5
      ? "Поставь этикетку в витрину письма, чтобы оставить только подтверждённое. В витрине сравнения рядом будет помеченный черновик."
      : "Подготовь этикетку у музейного терминала, прежде чем открывать витрину.");
  }
}

function ending() {
  const outcome = state.verdict === "displayCompare"
    ? "В витрине лежат письмо и помеченный черновик. Посетители видят, откуда взялся выдуманный номер комнаты."
    : "В витрине лежит письмо. На табличке указаны автор, время и источник. Графа «Адрес» осталась пустой.";
  show("Дело № 17 · Закрыто", "Письмо вернулось в архив",
    make("p", "", outcome),
    make("blockquote", "document", "Запись архивиста\n«Через сто лет у нас по-прежнему есть её слова. Этого достаточно, чтобы сохранить письмо»."),
    dismissButton("Вернуться в архив"));
}

const inspect = {
  desk: () => record(state.stage < 3 ? "cover" : "letter", state.stage === 0 ? "folder" : null),
  catalog: () => record("rules"),
  sorter: () => detail("Сортировщик", "Подача бумаги слева. Чтобы получить индекс ящика, положи папку на сортировщик. Карточка правил в картотеке."),
  labExhibit: () => detail("Витрина машины", "На месте старого сортировщика осталась фотография. Новая система пишет экспозицию по оцифрованным документам."),
  terminal: () => state.stage >= 4 ? record("draft") : detail("Терминал ИИ", "Для черновика нужна проверенная запись из цифровой мастерской."),
  registry: () => detail("Реестр источников", "В каталоге видны документы с установленным происхождением. Выставочные описания проходят отдельную проверку."),
  toolbox: () => {
    const filterAvailable = state.stage === 2 && !state.lit && !state.inventory.includes("filter");
    detail("Ящик инструментов", filterAvailable
      ? "Круглое стекло из нижнего ящика устанавливается в гнездо светового стола."
      : "Здесь хранят инструмент для работы с фрагментами бумаги.", filterAvailable ? "filter" : null);
  },
  lightTable: () => detail("Световой стол", state.lit
    ? "Свет проходит через бумагу. Уложи верхнюю и нижнюю части в соответствующие пазы."
    : "Круглое гнездо пустое. Поищи фильтр в ящике инструментов."),
  manual: () => record("marks"),
  study,
  scanner: () => detail("Сканер", "Положи на стекло восстановленный оригинал. Сканер снимет копию письма и прочтёт штамп на обороте."),
  sampleRack: study,
  receipt: () => {
    const fragmentAvailable = state.stage === 2 && !state.topPlaced && !state.inventory.includes("top");
    detail("Стол приёмки", fragmentAvailable
      ? "Бумага лежит на подложке, чтобы чернила не отпечатались на соседних листах. На обороте виден знак ○."
      : "Здесь архивист ставил круглую печать перед отправкой бумаги на реставрацию.", fragmentAvailable ? "top" : null);
  },
  oldDrawers: () => detail("Архивные ящики", "У каждого типа документа был свой ящик. Их назначение перенесли в указатель музейного хранилища."),
  register: () => detail("Опись фонда", "В деле № 17 записаны две части. Обложку с маршрутом хранят в лаборатории."),
  display: showDisplay,
  storage: () => record("index"),
  transcript: () => state.stage > 1 ? record("damage") : detail("Пульт хранителя", "Хранилище ждёт маршрутную карту с индексом. Приложи её к ящику под сценой."),
};

function inspectTarget(control) {
  const target = control.dataset.target;
  returnFocus = '[data-target="' + target + '"]';
  if (canUse(selected, target)) useItem(selected, target);
  else if (inspect[target]) inspect[target]();
  else detail("Рабочее место", control.innerText.replaceAll("\n", " · ") + ". Выбери предмет в инвентаре.");
}

function targetAt(x, y) {
  const control = document.elementFromPoint(x, y)?.closest("[data-target]");
  return control && !control.disabled ? control : null;
}

function dragTarget(current) {
  const target = targetAt(current.x, current.y);
  const matching = target && canUse(current.id, target.dataset.target) ? target : null;
  if (matching === current.target) return;
  current.target?.classList.remove("drop-hover");
  matching?.classList.add("drop-hover");
  current.target = matching;
}

function scrollWhileDragging(current) {
  if (drag !== current) return;
  const margin = 52;
  const scroll = current.y < margin ? -9 : current.y > window.innerHeight - margin ? 9 : 0;
  if (scroll) {
    window.scrollBy(0, scroll);
    dragTarget(current);
  }
  current.frame = requestAnimationFrame(() => scrollWhileDragging(current));
}

const inventoryControl = go("inventory-items");
inventoryControl.addEventListener("pointerdown", (event) => {
  const item = event.target.closest("[data-item]");
  if (!item || !event.isPrimary || event.button !== 0) return;
  item.setPointerCapture(event.pointerId);
  drag = { id: item.dataset.item, pointer: event.pointerId, startX: event.clientX, startY: event.clientY };
});

inventoryControl.addEventListener("pointermove", (event) => {
  if (!drag || drag.pointer !== event.pointerId) return;
  drag.x = event.clientX;
  drag.y = event.clientY;
  if (!drag.ghost && Math.hypot(drag.x - drag.startX, drag.y - drag.startY) > 6) {
    selected = drag.id;
    highlights();
    const [icon, label] = items[drag.id];
    drag.ghost = make("div", "drag-ghost");
    drag.ghost.append(make("span", "item-icon", icon), make("span", "item-name", label));
    drag.ghost.style.pointerEvents = "none";
    drag.ghost.setAttribute("aria-hidden", "true");
    document.body.append(drag.ghost);
    document.body.classList.add("dragging-item");
    const current = drag;
    current.frame = requestAnimationFrame(() => scrollWhileDragging(current));
  }
  if (drag.ghost) {
    drag.ghost.style.left = drag.x + "px";
    drag.ghost.style.top = drag.y + "px";
    dragTarget(drag);
  }
});

function endDrag(event) {
  if (!drag || drag.pointer !== event.pointerId) return;
  const current = drag;
  drag = null;
  if (!current.ghost) return;
  cancelAnimationFrame(current.frame);
  current.ghost.remove();
  current.target?.classList.remove("drop-hover");
  document.body.classList.remove("dragging-item");
  const target = event.type === "pointerup" ? targetAt(event.clientX, event.clientY) : null;
  if (target) {
    const targetId = target.dataset.target;
    // Keep the captured button alive through the browser's touchend dispatch.
    setTimeout(() => {
      returnFocus = '[data-target="' + targetId + '"]';
      useItem(current.id, targetId);
    }, 0);
  } else {
    status("Предмет в руке. Перетащи его на объект или выбери объект нажатием.");
  }
  // A pointerup after movement can emit a click on the captured inventory button.
  const blockClick = (click) => click.stopImmediatePropagation();
  inventoryControl.addEventListener("click", blockClick, { capture: true, once: true });
  setTimeout(() => inventoryControl.removeEventListener("click", blockClick, true), 0);
}

for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
  inventoryControl.addEventListener(type, endDrag);
}

inventoryControl.addEventListener("click", (event) => {
  const item = event.target.closest("[data-item]");
  if (item) select(item.dataset.item);
});

for (const field of [go("hotspots"), go("room-bench")]) {
  field.addEventListener("click", (event) => {
    const target = event.target.closest("[data-target]");
    if (target && !target.disabled) inspectTarget(target);
  });
}

document.querySelectorAll("[data-era-control]").forEach((control) => {
  control.addEventListener("click", () => navigate(control.dataset.eraControl));
});

dialog.addEventListener("close", () => {
  const control = (returnFocus && document.querySelector(returnFocus)) ??
    go("room-nav").querySelector('[aria-pressed="true"]');
  control?.focus({ preventScroll: true });
  returnFocus = null;
});

dialog.addEventListener("touchend", (event) => {
  const control = event.target.closest(".close, [data-dismiss]");
  if (!control || event.changedTouches.length !== 1) return;
  const { clientX, clientY } = event.changedTouches[0];
  if (!control.contains(document.elementFromPoint(clientX, clientY))) return;
  // Modal dismissal still works when a preceding drag suppresses the synthetic click.
  event.preventDefault();
  dialog.close();
}, { passive: false });

go("hint").addEventListener("click", () => {
  returnFocus = "#hint";
  if (state.stage === chapters.length) ending();
  else show("Дело № 17", "Подсказка", make("p", "", chapters[state.stage][2]));
});

go("help").addEventListener("click", () => {
  returnFocus = "#help";
  show("Управление", "Как играть",
    make("p", "", "Осматривай предметы и забирай находки. Перетащи вещь из инвентаря на подсвеченный механизм. Можно выбрать вещь нажатием, а затем нажать на механизм."),
    make("p", "aside", "Клавиши 1 и 2 переключают эпохи. Tab перемещает фокус, Enter и пробел выбирают предмет или цель. Esc закрывает документ или освобождает руку."),
    button("Начать заново…", "choice", () => {
      show("Прогресс", "Начать заново?",
        make("p", "", "Находки и решения в этом браузере будут сброшены."),
        button("Сбросить прогресс", "choice", () => {
          state = fresh();
          selected = null;
          update();
          status("Открой рабочий стол, чтобы взять первый предмет.");
          dialog.close();
        }),
        dismissButton("Продолжить расследование"));
    }));
});

go("credits").addEventListener("click", () => {
  returnFocus = "#credits";
  show("О расследовании", "Архив между эпохами",
    make("p", "", "Вымышленная история об архиве. Игровые этапы показывают, как меняется работа с информацией от ручных правил до машинного обучения и генерации."),
    make("p", "aside", "Сценарий, код и иллюстрации созданы при участии ИИ. Классификатор сравнивает слова в браузере. Черновик музейной системы создан для сюжета."));
});

document.addEventListener("keydown", (event) => {
  if (dialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "1") navigate("past");
  if (event.key === "2") navigate("future");
  if (event.key === "Escape" && selected) select(selected);
});

update();
