const storageKey = "archive-between-eras/v1";

const documents = {
  cover: {
    title: "Обложка дела № 17",
    era: "1986",
    text: "Рукописное письмо.\nОтправитель: Л. Ветрова.\nПодпись сверена. Служебного номера нет.",
    note: "На обложке достаточно сведений, чтобы старый сортировщик выбрал ящик.",
  },
  rules: {
    title: "Правила сортировки",
    era: "1986",
    text: "Подписанное личное письмо → Л.\nДокумент со служебным номером → С.\nНеопознанный фрагмент → Ч.",
    note: "В 1986 году сотрудник записывал правила вручную. Сортировщик исполнял их по порядку.",
  },
  route: {
    title: "Указатель ящиков",
    era: "2086",
    text: "Л → Личные письма\nС → Служебные записи\nЧ → Черновики",
    note: "В стойке сохранилась копия старого указателя. Сами буквы ничего не объясняют без карточки правил.",
  },
  letter: {
    title: "Письмо Лиды Ветровой",
    era: "1986",
    text: "Закрой окно. Вернусь в субботу. На втором этаже опять пахнет известью после дождя.\nЛида Ветрова",
    note: "На обороте архивный штамп «Личное письмо». Отметок об адресе или номере комнаты нет.",
  },
  sample: {
    title: "Исправление в выборке",
    era: "2086",
    text: "Фрагмент «Закрой окно. Вернусь в субботу» восстановлен как часть личного письма Лиды Ветровой.",
    note: "Классификатор сравнивает слова из нового фрагмента с размеченными примерами. Исправление метки изменило его ответ.",
  },
  draft: {
    title: "Черновик музейного ИИ",
    era: "2086",
    text: "Лида Ветрова собиралась вернуться в субботу. Её ждали в лаборатории № 3 на втором этаже.",
    note: "Генеративный ИИ достроил связный рассказ. Для выставки нужно сверить, какие детали есть в оригинале.",
  },
};

const chapters = [
  {
    label: "Правила",
    task: "Найди индекс письма в 1986 году и выбери его ящик в 2086 году.",
    hint: "В прошлом осмотри Рабочий стол и Картотеку. В будущем открой Стойку хранения и сверь букву с названием ящика.",
  },
  {
    label: "Примеры",
    task: "Прочитай оригинал в прошлом, затем исправь метку учебного примера в будущем.",
    hint: "В 1986 году оригинал лежит на Рабочем столе. Штамп на обороте поможет разобраться в Витрине примеров.",
  },
  {
    label: "Источники",
    task: "Проверь черновик на музейном терминале. Какую деталь ИИ добавил сам?",
    hint: "Открой письмо из журнала. Найди в нём имя, день недели и этаж. Какой детали из черновика там нет?",
  },
];

const rooms = {
  past: {
    name: "Лаборатория архива",
    year: "1986",
    objects: [
      { id: "desk", name: "Рабочий стол", icon: "▤", x: 25, y: 65 },
      { id: "sorter", name: "Сортировщик", icon: "⊡", x: 52, y: 45 },
      { id: "catalog", name: "Картотека", icon: "▥", x: 80, y: 43 },
    ],
  },
  future: {
    name: "Музейное хранилище",
    year: "2086",
    objects: [
      { id: "exhibit", name: "Витрина примеров", icon: "▧", x: 24, y: 64 },
      { id: "terminal", name: "Терминал ИИ", icon: "◉", x: 52, y: 42 },
      { id: "storage", name: "Стойка хранения", icon: "▥", x: 79, y: 43 },
    ],
  },
};

const newGame = () => ({ era: "past", stage: 0, clues: [], verdict: null });
const get = (id) => document.getElementById(id);
const dialog = get("overlay");
const dialogBody = get("dialog-body");
let saveAvailable = true;
let state = load();
let returnFocus;

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Object.hasOwn(rooms, saved.era) &&
        Number.isInteger(saved.stage) && saved.stage >= 0 && saved.stage <= 4 &&
        Array.isArray(saved.clues)) {
      return { ...saved, clues: [...new Set(saved.clues.filter((id) => Object.hasOwn(documents, id)))] };
    }
  } catch {
    // A missing, damaged or unavailable saved game can be replaced with a fresh one.
  }
  return newGame();
}

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    saveAvailable = true;
  } catch {
    saveAvailable = false;
  }
}

function make(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content) element.textContent = content;
  return element;
}

function button(label, className, action) {
  const control = make("button", className, label);
  control.type = "button";
  control.addEventListener("click", action);
  return control;
}

function render() {
  const room = rooms[state.era];
  const finished = state.stage === 4;
  document.body.dataset.era = state.era;
  get("location").textContent = room.name;
  get("case-number").textContent = finished ? "Дело № 17 · Завершено" : "Дело № 17 · Открыто";
  get("save-status").textContent = saveAvailable ? "Прогресс сохраняется в этом браузере" : "Прогресс сохранится до закрытия этой вкладки";
  document.querySelectorAll("[data-era-control]").forEach((control) => {
    control.setAttribute("aria-pressed", String(control.dataset.eraControl === state.era));
  });
  get("steps").replaceChildren(...chapters.map((chapter, index) => {
    const done = state.stage > index;
    const step = make("li", done ? "complete" : "");
    if (state.stage === index) step.setAttribute("aria-current", "step");
    step.append(make("span", "step-number", done ? "✓" : String(index + 1)), make("span", "", chapter.label));
    return step;
  }));
  get("hotspots").replaceChildren(...room.objects.map((item) => {
    const hotspot = button("", "hotspot", () => inspect(item.id));
    const marker = make("span", "marker", item.icon);
    marker.setAttribute("aria-hidden", "true");
    hotspot.dataset.object = item.id;
    hotspot.style.setProperty("--x", item.x + "%");
    hotspot.style.setProperty("--y", item.y + "%");
    hotspot.append(marker, make("span", "hotspot-name", item.name));
    return hotspot;
  }));
  get("mission-label").textContent = finished ? "Расследование завершено" : "Текущая задача";
  get("mission").textContent = chapters[state.stage]?.task ?? (finished
    ? "Письмо вернулось в архив вместе с проверенными сведениями."
    : "Открой Терминал ИИ и реши, как выставить письмо.");
  get("hint").textContent = finished ? "Финал" : "Подсказка";
  get("clue-count").textContent = state.clues.length;
  get("empty").hidden = state.clues.length > 0;
  get("clues").replaceChildren(...state.clues.map((id) => {
    const entry = documents[id];
    const item = make("li");
    const control = button(entry.title, "clue", () => readDocument(id));
    control.dataset.clue = id;
    control.append(make("span", "clue-year", entry.era));
    item.append(control);
    return item;
  }));
}

function show(kicker, title, ...content) {
  get("dialog-kicker").textContent = kicker;
  get("dialog-title").textContent = title;
  dialogBody.replaceChildren(...content);
  if (!dialog.open) {
    dialog.showModal();
  } else {
    dialog.querySelector(".close").focus();
  }
}

function bookmark(id) {
  if (!state.clues.includes(id)) state.clues.push(id);
}

function readDocument(id) {
  const entry = documents[id];
  bookmark(id);
  save();
  render();
  show(entry.era + " · Документ", entry.title,
    make("blockquote", "document", entry.text), make("p", "aside", entry.note));
}

function advance(stage, kicker, title, text, actionLabel, action) {
  state.stage = stage;
  save();
  render();
  show(kicker, title, make("p", "", text), button(actionLabel, "primary", action));
}

function choose(options, action) {
  const controls = make("div", "choices");
  for (const option of options) controls.append(button(option.label, "choice", () => action(option.id)));
  return controls;
}

function feedback() {
  const message = make("p", "feedback");
  message.setAttribute("role", "status");
  return message;
}

function findDrawer() {
  if (state.stage > 0) {
    readDocument("route");
    return;
  }
  const route = documents.route;
  bookmark("route");
  save();
  render();
  const message = feedback();
  show("2086 · Стойка хранения", "Найди ящик для письма",
    make("blockquote", "document", route.text),
    make("p", "aside", "Сопоставь обложку дела с правилами 1986 года и открой нужный ящик."),
    choose([
      { id: "S", label: "Служебные записи" },
      { id: "L", label: "Личные письма" },
      { id: "C", label: "Черновики" },
    ], (id) => {
      if (!state.clues.includes("cover") || !state.clues.includes("rules")) {
        message.textContent = "Чтобы обосновать выбор, найди обложку и карточку правил в прошлом.";
      } else if (id !== "L") {
        message.textContent = "В этом ящике письма нет. Сверь подпись и служебный номер на обложке.";
      } else {
        advance(1, "Ящик Л · Найдено", "Письмо сохранилось",
          "Указатель привёл к оригиналу. Вернись в 1986 год и прочитай его на рабочем столе.",
          "К рабочему столу", () => {
            state.era = "past";
            readDocument("letter");
          });
      }
    }), message);
}

const fragment = "Закрой окно. Вернусь в субботу.";
const examples = [
  { id: "14", text: "Закрой окно. Проверка вентиляции завершена.", label: "Служебная запись" },
  { id: "17", text: "Закрой окно. Вернусь в субботу.", label: "Служебная запись" },
  { id: "22", text: "До завтра. Береги себя.", label: "Личное письмо" },
];

function words(text) {
  return new Set(text.toLowerCase().match(/[а-яё]+/gu));
}

function classify(corrected) {
  const query = words(fragment);
  const ranked = examples.map((example) => {
    const terms = words(example.text);
    const shared = [...query].filter((word) => terms.has(word)).length;
    return { ...example, similarity: shared / new Set([...query, ...terms]).size };
  }).sort((a, b) => b.similarity - a.similarity);
  const nearest = ranked[0];
  return corrected && nearest.id === "17" ? "Личное письмо" : nearest.label;
}

function trainingExhibit() {
  if (state.stage === 0) {
    show("2086 · Витрина примеров", "Учебная выборка",
      make("p", "", "Экспонат опирается на письмо из дела № 17. Сначала найди его ящик в стойке хранения."));
    return;
  }
  if (state.stage > 1) {
    readDocument("sample");
    return;
  }
  const choices = make("div", "choices");
  const message = feedback();
  for (const example of examples) {
    const control = button("", "choice", () => {
      if (!state.clues.includes("letter")) {
        message.textContent = "Открой оригинал в прошлом. На обороте есть архивная пометка.";
      } else if (example.id !== "17") {
        message.textContent = "Сопоставь дословный фрагмент письма с каждым учебным примером.";
      } else {
        bookmark("sample");
        advance(2, "2086 · Выборка исправлена", "Ответ модели изменился",
          "До исправления: «" + classify(false) + "». После исправления: «" + classify(true) +
          "». Теперь музейный ИИ может подготовить описание письма.",
          "К терминалу", auditDraft);
      }
    });
    control.append(make("div", "", "«" + example.text + "»"), make("span", "sample-tag", example.label));
    if (example.label === "Личное письмо") control.disabled = true;
    choices.append(control);
  }
  show("2086 · Витрина примеров", "Исправь неверную метку",
    make("blockquote", "document", "Запрос классификатора\n«" + fragment + "»\nОтвет: «" + classify(false) + "»."),
    make("p", "aside", "Укажи запись, которую следует переименовать в «Личное письмо». Модель выбирает пример с наибольшей долей общих слов."),
    choices, message);
}

function auditDraft() {
  if (state.stage < 2) {
    show("2086 · Терминал ИИ", "Черновик пока закрыт",
      make("p", "", "Система ждёт подтверждённую запись. Найди письмо и проверь его метку в Витрине примеров."));
    return;
  }
  if (state.stage >= 3) {
    if (state.stage === 4) ending();
    else publishChoice();
    return;
  }
  bookmark("draft");
  save();
  render();
  const message = feedback();
  show("2086 · Терминал ИИ", "Из чего это известно?",
    make("blockquote", "document", documents.draft.text),
    make("p", "aside", "Сверь черновик с оригиналом в журнале. Какая деталь появилась только в сводке ИИ?"),
    choose([
      { id: "author", label: "Имя «Лида Ветрова»" },
      { id: "room", label: "Лаборатория № 3" },
      { id: "day", label: "Возвращение в субботу" },
      { id: "floor", label: "Упоминание второго этажа" },
    ], (id) => {
      if (id === "room") {
        state.stage = 3;
        save();
        render();
        publishChoice();
      } else {
        message.textContent = "Эта деталь есть в письме. Оригинал сохранён в журнале находок.";
      }
    }), message);
}

function publishChoice() {
  show("2086 · Решение архивиста", "Как выставить письмо?",
    make("p", "", "В оригинале есть второй этаж. Номер лаборатории появился только в черновике. У письма по-прежнему нет установленного адреса."),
    choose([
      { id: "source", label: "Выставить письмо с проверенной подписью" },
      { id: "side-by-side", label: "Выставить письмо рядом с отмеченным черновиком" },
    ], (id) => {
      state.verdict = id;
      state.stage = 4;
      save();
      render();
      ending();
    }));
}

function ending() {
  const outcome = state.verdict === "side-by-side"
    ? "В витрине лежат письмо и черновик. Пометка объясняет посетителям, откуда взялся выдуманный номер лаборатории."
    : "В витрине лежит письмо. На табличке указаны автор, время и источник. Графа «Адрес» осталась пустой.";
  show("Дело № 17 · Завершено", "Письмо вернулось в архив",
    make("p", "", outcome),
    make("blockquote", "document", "Запись архивиста\n«Через сто лет у нас по-прежнему есть её слова. Этого достаточно, чтобы сохранить письмо»."),
    button("Вернуться в архив", "primary", () => dialog.close()));
}

const objects = {
  desk: () => readDocument(state.stage < 1 ? "cover" : "letter"),
  sorter: () => show("1986 · Сортировщик", "Программа готова",
    make("blockquote", "document", "ВВОД: признак документа.\nВЫВОД: индекс ящика."),
    make("p", "aside", "Машина выдаёт индекс по инструкции из Картотеки. Содержимое письма она не читает.")),
  catalog: () => readDocument("rules"),
  exhibit: trainingExhibit,
  terminal: auditDraft,
  storage: findDrawer,
};

function inspect(id) {
  returnFocus = "[data-object='" + id + "']";
  objects[id]();
}

function switchEra(era) {
  state.era = era;
  save();
  render();
}

document.querySelectorAll("[data-era-control]").forEach((control) => {
  control.addEventListener("click", () => switchEra(control.dataset.eraControl));
});

get("clues").addEventListener("click", (event) => {
  const control = event.target.closest("[data-clue]");
  if (control) returnFocus = "[data-clue='" + control.dataset.clue + "']";
});

dialog.addEventListener("close", () => {
  const control = document.querySelector(returnFocus ?? "#help")
    ?? document.querySelector('[data-era-control][aria-pressed="true"]');
  control?.focus({ preventScroll: true });
  returnFocus = undefined;
});

get("hint").addEventListener("click", () => {
  returnFocus = "#hint";
  if (state.stage === 4) ending();
  else show("Журнал", "Подсказка", make("p", "", chapters[state.stage]?.hint ?? "Открой Терминал ИИ в 2086 году и выбери способ показа письма."));
});

get("help").addEventListener("click", () => {
  returnFocus = "#help";
  show("Управление", "Как играть",
    make("p", "", "Осматривай предметы, переключайся между 1986 и 2086 годами и сверяй документы в журнале. Если решение зашло в тупик, открой подсказку под сценой."),
    make("p", "aside", "Клавиши 1 и 2 переключают эпохи, Esc закрывает документ."),
    button("Начать заново…", "choice", () => {
      show("Прогресс", "Начать заново?",
        make("p", "", "Текущие находки и решения будут сброшены."),
        button("Сбросить прогресс", "choice", () => {
          state = newGame();
          save();
          render();
          dialog.close();
        }),
        button("Продолжить расследование", "primary", () => dialog.close()));
    }));
});

get("credits").addEventListener("click", () => {
  returnFocus = "#credits";
  show("Об игре", "Архив между эпохами",
    make("p", "", "Вымышленное музейное расследование о трёх подходах к обработке информации: правилах, обучении на примерах и генерации."),
    make("p", "aside", "Сценарий, код и иллюстрации созданы с участием генеративного ИИ. Классификатор работает в браузере, а музейный терминал показывает заранее написанный сюжетный черновик."));
});

document.addEventListener("keydown", (event) => {
  if (dialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "1") switchEra("past");
  if (event.key === "2") switchEra("future");
});

save();
render();
