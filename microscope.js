"use strict";

const cases = window.MicroscopeCases;
const main = document.getElementById("content");
const announcer = document.getElementById("announcer");
const storageKey = "ai-microscope/v1";
const statuses = {
  supported: { label: "Подтверждено", mark: "✓" },
  contradicted: { label: "Противоречит", mark: "×" },
  unknown: { label: "Данных мало", mark: "?" },
};
const decisions = {
  publish: "Оставить как есть",
  revise: "Исправить перед отправкой",
  verify: "Запросить ещё данные",
};
const blankDraft = () => ({ title: "", original: "", claims: [], conclusion: "" });
const initialState = () => ({ drafts: {}, own: blankDraft(), history: [], challenge: false });
let state = initialState();
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved) state = { ...state, ...saved };
} catch {
  // The app also works for this session when storage is unavailable.
}

let activeClaim = 0;
let openSource = 0;
let validation = "";
let addingEvidence = false;
let tab = "home";
let currentCase;

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    document.querySelector(".footer span:nth-child(2)").textContent = "Хранилище недоступно. Скачайте отчёт перед закрытием.";
  }
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function say(message) {
  announcer.textContent = "";
  requestAnimationFrame(() => { announcer.textContent = message; });
}

function focus(id) {
  const target = document.getElementById(id);
  if (target) target.focus();
}

function heading(title, detail, eyebrow = "") {
  return `<header class="page-heading">${eyebrow ? `<p class="overline">${eyebrow}</p>` : ""}<h1 id="view-title" tabindex="-1">${title}</h1><p>${detail}</p></header>`;
}

function mark(status) {
  const result = statuses[status];
  return result ? `<span class="status ${status}"><span aria-hidden="true">${result.mark}</span> ${result.label}</span>` : "";
}

function icon(name) {
  return `<span class="glyph glyph-${name}" aria-hidden="true"></span>`;
}

function evidenceList(item) {
  return item.sources.flatMap((source) => source.excerpts.map((excerpt) => ({
    ...excerpt, source: source.title, date: source.date,
  })));
}

function matchesEvidence(selection, expected) {
  return selection.length > 0 && selection.every((id) => expected.evidence.includes(id));
}

function startDraft(item) {
  return {
    selections: item.claims.map(() => ({ verdict: "", evidence: [] })),
    rewrite: "",
    decision: "",
    challenge: state.challenge,
  };
}

function caseCard(item) {
  const progress = state.drafts[item.id];
  const previous = state.history.find((entry) => entry.kind === "practice" && entry.caseId === item.id);
  let action = "Открыть дело";
  if (progress) action = progress.reportId ? "Посмотреть разбор" : "Продолжить";
  return `<article class="case-card">
    <div class="case-top">${icon(item.icon)}<span>${item.category}</span></div>
    <h3><a href="#case/${item.id}">${item.title}</a></h3>
    <p>${item.description}</p>
    <div class="case-meta"><span>${item.level}</span><span>${item.time}</span>${previous ? `<span class="case-score">${previous.score}/10</span>` : ""}</div>
    <a class="case-link" href="#case/${item.id}" aria-label="${action}. ${item.title}">${action}</a>
  </article>`;
}

function homePage() {
  const count = new Set(state.history.filter((entry) => entry.kind === "practice").map((entry) => entry.caseId)).size;
  const first = cases.find((item) => !state.history.some((entry) => entry.kind === "practice" && entry.caseId === item.id)) || cases[0];
  const started = Boolean(state.drafts[first.id] && !state.drafts[first.id].reportId);
  const startLabel = started ? "Продолжить дело" : "Начать расследование";
  return `<section class="hero">
    <div class="hero-copy">
      <p class="overline">Лаборатория проверки ответов ИИ</p>
      <h1 id="view-title" tabindex="-1">Проверьте,<br>что сказал ИИ<span>.</span></h1>
      <p>Разберите ответ на утверждения. Сверьте их с источниками и решите, что можно использовать.</p>
      <div class="actions"><a class="btn primary" href="#${count === cases.length ? "practice" : `case/${first.id}`}">${count === cases.length ? "Открыть учебные дела" : startLabel}</a><a class="btn ghost" href="#own">Проверить свой текст</a></div>
    </div>
    <div class="specimen" aria-hidden="true">
      <div class="specimen-grid"></div>
      <div class="specimen-orbit orbit-outer"></div><div class="specimen-orbit orbit-inner"></div>
      <div class="fragment fragment-draft"><span>ОТВЕТ ИИ</span><strong>«Встреча в понедельник»</strong></div>
      <div class="specimen-lens"><span></span></div>
      <div class="fragment fragment-source"><span>ПИСЬМО ОРГАНИЗАТОРА</span><strong>«Переносим на вторник»</strong></div>
      <div class="specimen-result"><span>×</span> Противоречит источнику</div>
    </div>
  </section>
  <section class="home-cases" aria-labelledby="training-title">
    <div class="section-head"><div><h2 id="training-title">Учебные дела</h2><p>В каждом деле есть черновик ИИ и документы для проверки.</p></div>
      <a class="plain-link" href="#practice">${count ? `Пройдено ${count} из ${cases.length} · ` : ""}Все дела</a>
    </div>
    <div class="case-grid">${cases.map(caseCard).join("")}</div>
  </section>
  <section class="archive-promo" aria-labelledby="archive-title">
    <img src="assets/cover.webp" alt="" loading="lazy" width="1536" height="1024">
    <div><p class="overline">Сюжетное дополнение</p><h2 id="archive-title">Архив между эпохами</h2>
    <p>Расследуйте историю записки Лиды Ветровой в двух эпохах и решите, что музей расскажет о ней посетителям.</p><a class="btn ghost" href="archive.html">Играть в «Письмо без адреса»</a></div>
  </section>`;
}

function practicePage() {
  return heading("Тренажёр", "Выберите дело, разберите ответ ИИ и получите разбор по каждому утверждению.") +
    `<div class="practice-tools"><label class="switch-label"><input type="checkbox" data-field="challenge" ${state.challenge ? "checked" : ""}> Новые дела без подсказок</label><span>В документах используются вымышленные учебные ситуации.</span></div>
    <div class="case-grid">${cases.map(caseCard).join("")}</div>`;
}

function verdictOptions(selected, name) {
  return `<div class="verdict-options">${Object.entries(statuses).map(([id, status]) => `<label class="verdict-option ${id}">
    <input type="radio" value="${id}" name="${name}" data-field="${name}" ${selected === id ? "checked" : ""}>
    <span><b aria-hidden="true">${status.mark}</b> ${status.label}</span></label>`).join("")}</div>`;
}

function progress(label, done, total) {
  return `<div class="progress"><span>${label}</span><strong>${done} / ${total}</strong><progress max="${total}" value="${done}" aria-label="${label}"></progress></div>`;
}

function practiceWorkspace(item) {
  const draft = state.drafts[item.id];
  const claim = item.claims[activeClaim];
  const choice = draft.selections[activeClaim];
  const selectedEvidence = evidenceList(item).filter((piece) => choice.evidence.includes(piece.id));
  const ready = draft.selections.filter((selection) => selection.verdict && selection.evidence.length).length;
  const report = state.history.find((entry) => entry.id === draft.reportId);
  if (report) return reportPage(report, item);
  const source = item.sources[openSource];
  return `<a class="crumb" href="#practice">Учебные дела</a>
    ${heading(item.title, item.task, item.category)}
    <div class="case-status">${progress("Утверждения с выводом и источником", ready, item.claims.length)}<span>${draft.challenge ? "Без подсказок" : "С подсказками"}</span></div>
    <div class="workbench">
      <section class="panel" aria-labelledby="answer-title">
        <div class="panel-heading"><h2 id="answer-title">Черновик ИИ</h2><p>Выберите утверждение для проверки.</p></div>
        <div class="claim-list">${item.claims.map((entry, index) => {
          const selection = draft.selections[index];
          return `<button class="claim-selector ${activeClaim === index ? "selected" : ""}" id="claim-select-${index}" type="button" data-action="claim" data-id="${index}" aria-pressed="${activeClaim === index}"><span class="claim-number">${index + 1}</span><span>${entry.text}</span><span class="claim-check" aria-label="${selection.verdict && selection.evidence.length ? "Заполнено" : "Не заполнено"}">${selection.verdict && selection.evidence.length ? "✓" : "·"}</span></button>`;
        }).join("")}</div>
        <div class="claim-detail">
          <fieldset><legend>Вердикт по утверждению ${activeClaim + 1}</legend>${verdictOptions(choice.verdict, "verdict")}</fieldset>
          <div class="evidence-heading"><h3>Приложенные фрагменты</h3><button type="button" class="text-button" data-action="focus-sources">К источникам</button></div>
          ${selectedEvidence.length ? `<ul class="attached">${selectedEvidence.map((piece) => `<li><div><strong>${piece.source}</strong><blockquote>${piece.text}</blockquote></div><button class="icon-btn remove" type="button" id="remove-${piece.id}" data-action="evidence" data-id="${piece.id}" aria-label="Убрать фрагмент из источника «${piece.source}»">×</button></li>`).join("")}</ul>` : "<p class='muted'>Здесь появятся фрагменты из документов.</p>"}
        </div>
      </section>
      <section class="panel" aria-labelledby="sources-title">
        <div class="panel-heading"><h2 id="sources-title" tabindex="-1">Источники</h2><p>Фрагмент прикрепится к утверждению ${activeClaim + 1}.</p></div>
        <div class="source-list">${item.sources.map((entry, index) => `<button id="source-${index}" class="source-button ${index === openSource ? "selected" : ""}" type="button" data-action="source" data-id="${index}" aria-pressed="${index === openSource}" aria-controls="source-content"><span><strong>${entry.title}</strong><small>${entry.type} · ${entry.date}</small></span><span aria-hidden="true">${index === openSource ? "●" : "○"}</span></button>`).join("")}</div>
        <div class="source-content" id="source-content" aria-label="${source.title}">${source.excerpts.map((piece) => {
          const attached = choice.evidence.includes(piece.id);
          return `<div class="excerpt"><blockquote>${piece.text}</blockquote><button id="cite-${piece.id}" class="btn small ${attached ? "attached-button" : "ghost"}" type="button" data-action="evidence" data-id="${piece.id}" aria-pressed="${attached}">${attached ? "✓ Прикреплено" : "Прикрепить фрагмент"}</button></div>`;
        }).join("")}</div>
        ${draft.challenge ? "" : '<p class="source-tip">Смотрите, кто составил документ и когда. Для вывода «Данных мало» приложите фрагмент, который показывает, чего не хватает.</p>'}
        <div class="source-actions"><button class="text-button" type="button" data-action="focus-claim">К утверждению ${activeClaim + 1}</button>${choice.verdict && choice.evidence.length && activeClaim < item.claims.length - 1 ? '<button class="text-button" type="button" data-action="next-claim">Следующее утверждение</button>' : ""}</div>
      </section>
    </div>
    <section class="panel editor" aria-labelledby="edit-title">
      <div class="panel-heading"><h2 id="edit-title">Решение редактора</h2><p>Напишите ответ, который вы готовы отправить. Если нужен ещё один источник, укажите какой.</p></div>
      <label class="field">Ваш вариант ответа<textarea id="practice-rewrite" data-field="rewrite" maxlength="1800" rows="4" placeholder="Что можно сообщить по имеющимся документам?">${safe(draft.rewrite)}</textarea></label>
      <fieldset><legend>Что сделать с черновиком ИИ?</legend><div class="decision-options">${Object.entries(decisions).map(([id, label]) => `<label><input type="radio" id="decision-${id}" name="decision" data-field="decision" value="${id}" ${draft.decision === id ? "checked" : ""}> ${label}</label>`).join("")}</div></fieldset>
      <div class="actions end-actions"><button class="btn primary" type="button" data-action="submit-practice">Получить разбор</button><p class="error" id="validation" role="alert">${safe(validation)}</p></div>
    </section>`;
}

function ownPage() {
  const draft = state.own;
  const item = draft.claims[activeClaim];
  return heading("Моя проверка", "Вставьте ответ ИИ, выделите проверяемые утверждения и приложите источники. Вы сами оцениваете каждое утверждение.") +
    `<section class="panel editor" aria-labelledby="own-text-title">
      <div class="panel-heading"><h2 id="own-text-title">Ответ на проверку</h2></div>
      <label class="field">Название проверки <span class="muted">(по желанию)</span><input id="own-title" type="text" data-field="title" maxlength="100" value="${safe(draft.title)}" placeholder="Например, факты для доклада"></label>
      <label class="field">Исходный ответ ИИ<textarea id="own-original" data-field="original" maxlength="10000" rows="5" placeholder="Вставьте текст, который хотите проверить">${safe(draft.original)}</textarea></label>
      <button class="btn ghost" id="add-claim" type="button" data-action="add-claim" ${draft.claims.length >= 12 ? "disabled" : ""}>+ Добавить утверждение</button>
      <p class="muted selection-tip">Можно выделить фразу прямо в исходном ответе и добавить её как утверждение.</p>
    </section>
    ${item ? `<div class="workbench own-workbench">
      <section class="panel" aria-labelledby="own-claims-title">
        <div class="panel-heading"><h2 id="own-claims-title">Утверждения</h2><p>Отметьте, что показывают найденные материалы.</p></div>
        <div class="claim-list">${draft.claims.map((entry, index) => `<button class="claim-selector ${activeClaim === index ? "selected" : ""}" id="claim-select-${index}" type="button" data-action="claim" data-id="${index}" aria-pressed="${activeClaim === index}"><span class="claim-number">${index + 1}</span><span id="own-claim-label-${index}">${safe(entry.text.trim().slice(0, 90) || "Новое утверждение")}</span><span class="claim-check" aria-label="${entry.verdict ? "Есть вердикт" : "Нет вердикта"}">${entry.verdict ? "✓" : "·"}</span></button>`).join("")}</div>
        <div class="claim-detail">
          <label class="field">Формулировка<textarea id="own-claim" data-field="claim-text" maxlength="600" rows="3" placeholder="Одна мысль, которую можно проверить">${safe(item.text)}</textarea></label>
          <fieldset><legend>Вердикт</legend>${verdictOptions(item.verdict, "own-verdict")}</fieldset>
          <button class="text-button delete-claim" type="button" data-action="remove-claim">Удалить утверждение</button>
        </div>
      </section>
      <section class="panel" aria-labelledby="sources-title">
        <div class="panel-heading"><h2 id="sources-title">Источники</h2><p>Для утверждения ${activeClaim + 1}.</p></div>
        <div class="own-evidence">
          ${item.evidence.length ? `<ul class="attached">${item.evidence.map((piece, index) => `<li><div><strong>${safe(piece.source)}</strong><blockquote>${safe(piece.quote)}</blockquote></div><button class="icon-btn remove" type="button" data-action="remove-own-evidence" data-id="${index}" aria-label="Убрать источник ${index + 1}">×</button></li>`).join("")}</ul>` : "<p class='muted'>Добавьте ссылку или название документа и нужную цитату.</p>"}
          ${addingEvidence ? `<form id="own-evidence-form"><label class="field">Ссылка или название источника<input id="own-source-name" name="source" data-field="evidence-source" type="text" maxlength="300" value="${safe(item.pendingEvidence?.source)}" required></label>
            <label class="field">Фрагмент источника<textarea name="quote" data-field="evidence-quote" rows="3" maxlength="1500" required>${safe(item.pendingEvidence?.quote)}</textarea></label>
            <div class="actions"><button class="btn primary small" type="submit">Прикрепить</button><button class="btn ghost small" type="button" data-action="cancel-evidence">Отмена</button></div></form>` : `<button class="btn ghost" id="add-evidence" type="button" data-action="add-evidence" ${item.evidence.length >= 6 ? "disabled" : ""}>+ Прикрепить источник</button>`}
        </div>
      </section>
    </div>` : ""}
    <section class="panel editor" aria-labelledby="own-result-title">
      <div class="panel-heading"><h2 id="own-result-title">Вывод</h2><p>Напишите, что можно использовать после проверки и что ещё стоит уточнить.</p></div>
      <label class="field">Итоговый текст<textarea id="own-conclusion" data-field="conclusion" maxlength="3000" rows="4" placeholder="Подтверждённые сведения и открытые вопросы">${safe(draft.conclusion)}</textarea></label>
      <div class="actions end-actions"><button class="btn primary" type="button" data-action="save-own">Сохранить отчёт</button><p class="error" id="validation" role="alert">${safe(validation)}</p></div>
    </section>`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function historyPage() {
  return heading("История", "Открывайте предыдущие разборы и скачивайте свои отчёты.") +
    (state.history.length ? `<ul class="history-list">${state.history.map((entry) => `<li class="panel">
      <div><p class="overline">${entry.kind === "practice" ? "Учебное дело" : "Моя проверка"} · ${formatDate(entry.date)}</p><h2><a href="#report/${entry.id}">${safe(entry.title)}</a></h2></div>
      ${entry.kind === "practice" ? `<span class="history-score">${entry.score}/10</span>` : ""}
      <a class="btn ghost small" href="#report/${entry.id}" aria-label="Открыть отчёт. ${safe(entry.title)}">Открыть</a></li>`).join("")}</ul>`
      : '<div class="empty panel"><h2>Пока нет отчётов</h2><p>Здесь появится результат после первого дела или сохранения своей проверки.</p><a class="btn primary" href="#practice">К учебным делам</a></div>');
}

function reportPage(entry, item = cases.find((candidate) => candidate.id === entry.caseId)) {
  const practice = entry.kind === "practice";
  const fromCase = tab === "case";
  return `<a class="crumb" href="#${fromCase ? "practice" : "history"}">${fromCase ? "Учебные дела" : "История"}</a>
    ${heading(safe(entry.title), `${practice ? "Разбор учебного дела" : "Отчёт о собственной проверке"} · ${formatDate(entry.date)}`)}
    ${practice ? `<section class="scoreboard panel">
      <div class="score-number"><strong>${entry.score}</strong><span>из 10</span></div>
      <div><h2>${entry.score === 10 ? "Все решения обоснованы" : "Разбор решений"}</h2><p>За верный вердикт даются 2 балла, за подбор фрагментов без лишних — 1, за решение редактора — 1 на всё дело.</p></div>
      <div class="score-details"><span>Вердикты <b>${entry.verdictPoints}/6</b></span><span>Источники <b>${entry.evidencePoints}/3</b></span><span>Решение <b>${entry.decisionPoint}/1</b></span></div>
    </section>` : `<details class="panel original-report"><summary>Исходный ответ ИИ</summary><p>${safe(entry.original)}</p></details>`}
    <section class="report-claims" aria-label="Проверенные утверждения">${entry.claims.map((entryClaim, index) => {
      const expected = item?.claims[index];
      const useful = item ? evidenceList(item).filter((piece) => expected.evidence.includes(piece.id)) : [];
      return `<article class="panel report-card"><div class="report-card-head"><h2><span class="claim-number">${index + 1}</span> ${safe(entryClaim.text)}</h2>${mark(entryClaim.verdict)}</div>
        ${expected ? `<p class="expected">${entryClaim.verdict === expected.verdict ? "Вердикт верный." : `Ожидаемый вердикт — «${statuses[expected.verdict].label}».`} ${expected.explanation}</p>` : ""}
        ${entryClaim.evidence.length ? `<div class="report-sources"><h3>Приложенные фрагменты</h3>${entryClaim.evidence.map((piece) => `<blockquote><strong>${safe(piece.source)}</strong><span>${safe(piece.quote)}</span></blockquote>`).join("")}</div>` : ""}
        ${expected ? `<p class="muted">${matchesEvidence(entryClaim.evidence.map((piece) => piece.id), expected) ? "Фрагменты подходят." : `Сверьте выбор фрагментов с документами: ${[...new Set(useful.map((piece) => piece.source))].join(", ")}.`}</p>` : ""}
      </article>`;
    }).join("")}</section>
    <section class="panel editor report-conclusion">
      <div class="panel-heading"><h2>${practice ? "Решение редактора" : "Итог проверки"}</h2></div>
      ${practice ? `<p><strong>Ваш выбор:</strong> ${decisions[entry.decision]}</p><p>${item.decisionWhy}</p>` : ""}
      <blockquote>${safe(entry.conclusion)}</blockquote>
      ${practice ? `<h3>Пример ответа по документам</h3><blockquote>${item.rewrite}</blockquote><p class="lesson">${item.lesson}</p><p class="muted">Свой текст можно сравнить с примером. Баллы начисляются за вердикты, документы и решение редактора.</p>` : ""}
      <div class="actions end-actions">
        <button type="button" class="btn primary" data-action="download" data-id="${entry.id}">Скачать отчёт</button>
        ${practice ? `<a class="btn ghost" href="#practice">Другие дела</a><button type="button" class="text-button" data-action="retry" data-id="${item.id}">Пройти заново</button>` : '<a class="btn ghost" href="#own">Вернуться к черновику</a>'}
      </div>
    </section>`;
}

function guidePage(about) {
  if (about) return heading("О проекте", "Браузерное приложение для практики проверки ответов искусственного интеллекта.") +
    `<div class="guide-grid"><section class="panel guide-card"><h2>Учебные дела</h2><p>Сюжеты, документы и ответы ИИ подготовлены для тренировки. Все события и персонажи вымышлены. Правила оценки заранее заданы для каждого дела.</p></section>
    <section class="panel guide-card"><h2>Как участвовал ИИ</h2><p>Codex помог разработать интерфейс, механику и учебные сценарии. Иллюстрации к «Архиву между эпохами» созданы с помощью ImageGen.</p></section>
    <section class="panel guide-card"><h2>Хранение данных</h2><p>Собственные тексты, источники и история сохраняются в браузере. Приложение работает без аккаунта и не отправляет их на сервер. Отчёты можно скачать в формате TXT.</p></section></div>
    <div class="actions guide-actions"><a class="btn primary" href="#practice">Открыть тренажёр</a><a class="btn ghost" href="https://github.com/EKlimiks/archive-between-eras">Исходный код на GitHub</a></div>`;
  return heading("Как проверять ответы ИИ", "Используйте эти шаги для учебного дела или проверки своего текста.") +
    `<ol class="guide-steps">
      <li class="panel"><h2>Выделите отдельные утверждения</h2><p>Одна фраза может содержать дату, число и вывод. Проверьте каждое из них отдельно.</p></li>
      <li class="panel"><h2>Найдите первичный источник</h2><p>Для цитаты ищите запись или расшифровку, для числа — исходную таблицу и методику, для даты — последнюю версию объявления.</p></li>
      <li class="panel"><h2>Сопоставьте точные формулировки</h2><p>Отметьте, подтверждает ли документ утверждение, прямо ему противоречит или оставляет вопрос открытым.</p></li>
      <li class="panel"><h2>Сохраните доказательства и вывод</h2><p>Приложите фрагмент источника. Перепишите ответ с учётом найденного или укажите, каких сведений пока не хватает.</p></li>
    </ol><div class="actions guide-actions"><a class="btn primary" href="#case/schedule">Попробовать на учебном деле</a><a class="btn ghost" href="#own">Проверить свой ответ</a></div>`;
}

function render(focusId) {
  const reportId = location.hash.split("/")[1];
  const report = state.history.find((entry) => entry.id === reportId);
  const pages = {
    home: homePage,
    practice: practicePage,
    case: () => practiceWorkspace(currentCase),
    own: ownPage,
    history: historyPage,
    report: () => reportPage(report),
    guide: () => guidePage(false),
    about: () => guidePage(true),
  };
  main.dataset.page = tab;
  main.innerHTML = pages[tab]();
  const section = ({ case: "practice", report: "history" })[tab] || tab;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === section) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.title = tab === "home" ? "ИИ под микроскопом" : `${document.getElementById("view-title").textContent} · ИИ под микроскопом`;
  if (focusId) focus(focusId);
}

function navigate(moveFocus = true) {
  if (location.hash === "#content") {
    focus("content");
    return;
  }
  const [route, id] = location.hash.slice(1).split("/");
  tab = ["home", "practice", "case", "own", "history", "report", "guide", "about"].includes(route) ? route : "home";
  currentCase = cases.find((item) => item.id === id);
  if (tab === "case" && !currentCase) tab = "practice";
  if (tab === "report" && !state.history.some((entry) => entry.id === id)) tab = "history";
  if (tab === "case" && !state.drafts[id]) {
    state.drafts[id] = startDraft(currentCase);
    save();
  }
  activeClaim = 0;
  openSource = 0;
  addingEvidence = false;
  validation = "";
  render(moveFocus ? "view-title" : undefined);
  if (moveFocus) window.scrollTo(0, 0);
}

function error(message, field) {
  validation = message;
  document.getElementById("validation").textContent = message;
  focus(field);
}

function keepReport(entry) {
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const report = { ...entry, id, date: Date.now() };
  state.history.unshift(report);
  return report;
}

function submitPractice() {
  const item = currentCase;
  const draft = state.drafts[item.id];
  const missing = draft.selections.findIndex((selection) => !selection.verdict || !selection.evidence.length);
  if (missing !== -1) {
    activeClaim = missing;
    render(`claim-select-${missing}`);
    say(`Выберите вердикт и приложите фрагмент для утверждения ${missing + 1}.`);
    document.querySelector(".claim-detail").insertAdjacentHTML("afterbegin", "<p class='error'>Выберите вердикт и приложите фрагмент источника.</p>");
    return;
  }
  if (draft.rewrite.trim().length < 15) return error("Добавьте свой вариант ответа, минимум 15 знаков.", "practice-rewrite");
  if (!draft.decision) return error("Выберите, что сделать с черновиком ИИ.", "decision-publish");
  const excerpts = evidenceList(item);
  let verdictPoints = 0;
  let evidencePoints = 0;
  const claims = draft.selections.map((selection, index) => {
    const expected = item.claims[index];
    if (selection.verdict === expected.verdict) verdictPoints += 2;
    if (matchesEvidence(selection.evidence, expected)) evidencePoints++;
    const evidence = excerpts.filter((piece) => selection.evidence.includes(piece.id)).map((piece) => ({
      id: piece.id, source: `${piece.source} · ${piece.date}`, quote: piece.text,
    }));
    return { text: expected.text, verdict: selection.verdict, evidence };
  });
  const decisionPoint = draft.decision === item.decision ? 1 : 0;
  const report = keepReport({
    kind: "practice", caseId: item.id, title: item.title, claims,
    conclusion: draft.rewrite.trim(), decision: draft.decision,
    verdictPoints, evidencePoints, decisionPoint, score: verdictPoints + evidencePoints + decisionPoint,
  });
  draft.reportId = report.id;
  save();
  render("view-title");
  window.scrollTo(0, 0);
}

function saveOwn() {
  const draft = state.own;
  if (!draft.original.trim()) return error("Вставьте исходный ответ ИИ.", "own-original");
  if (!draft.claims.length) return error("Добавьте хотя бы одно утверждение для проверки.", "add-claim");
  const missing = draft.claims.findIndex((item) => !item.text.trim() || !item.verdict || (item.verdict !== "unknown" && !item.evidence.length));
  if (missing !== -1) {
    activeClaim = missing;
    addingEvidence = false;
    render(`claim-select-${missing}`);
    say(`Дополните утверждение ${missing + 1}. Для подтверждения или опровержения нужен источник.`);
    document.querySelector(".claim-detail").insertAdjacentHTML("afterbegin", "<p class='error'>Заполните формулировку, выберите вердикт и приложите источник, если подтверждаете или опровергаете утверждение.</p>");
    return;
  }
  if (!draft.conclusion.trim()) return error("Напишите итог проверки.", "own-conclusion");
  const report = keepReport({
    kind: "own", title: draft.title.trim() || "Моя проверка",
    original: draft.original.trim(), conclusion: draft.conclusion.trim(),
    claims: draft.claims.map((item) => ({
      text: item.text.trim(), verdict: item.verdict, evidence: item.evidence.map((piece) => ({ ...piece })),
    })),
  });
  save();
  location.hash = `report/${report.id}`;
}

function download(entry) {
  const item = cases.find((candidate) => candidate.id === entry.caseId);
  const lines = ["ИИ под микроскопом", entry.title, formatDate(entry.date), ""];
  if (item) lines.push("Результат: " + entry.score + "/10", "Решение: " + decisions[entry.decision], "Разбор решения: " + item.decisionWhy, "");
  if (entry.original) lines.push("Исходный ответ ИИ", entry.original, "");
  entry.claims.forEach((claim, index) => {
    lines.push(`${index + 1}. ${claim.text}`, `Вердикт: ${statuses[claim.verdict].label}`);
    if (item) lines.push("По документам: " + item.claims[index].explanation);
    claim.evidence.forEach((piece) => lines.push(`Источник: ${piece.source}`, `Фрагмент: ${piece.quote}`));
    lines.push("");
  });
  lines.push("Итоговый текст", entry.conclusion);
  if (item) lines.push("", "Пример ответа по документам", item.rewrite);
  const url = URL.createObjectURL(new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = item ? `microscope-${item.id}.txt` : "microscope-report.txt";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  say("Отчёт подготовлен для скачивания.");
}

function attachExcerpt(id, trigger) {
  const choice = state.drafts[currentCase.id].selections[activeClaim];
  const exists = choice.evidence.includes(id);
  if (exists) choice.evidence = choice.evidence.filter((entry) => entry !== id);
  else choice.evidence.push(id);
  save();
  render(trigger.startsWith("remove-") ? `claim-select-${activeClaim}` : trigger);
  say(exists ? "Фрагмент убран." : `Фрагмент прикреплён к утверждению ${activeClaim + 1}.`);
}

function addClaim() {
  if (state.own.claims.length >= 12) return;
  const original = document.getElementById("own-original");
  const selection = original.value.slice(original.selectionStart, original.selectionEnd).trim().slice(0, 600);
  state.own.claims.push({ text: selection, verdict: "", evidence: [] });
  activeClaim = state.own.claims.length - 1;
  addingEvidence = false;
  save();
  render("own-claim");
}

const actions = {
  claim(button) {
    activeClaim = Number(button.dataset.id);
    addingEvidence = false;
    render(button.id);
  },
  source(button) {
    openSource = Number(button.dataset.id);
    render(button.id);
  },
  "focus-sources": () => focus("sources-title"),
  "focus-claim": () => focus(`claim-select-${activeClaim}`),
  "next-claim"() {
    activeClaim++;
    render(`claim-select-${activeClaim}`);
  },
  evidence: (button) => attachExcerpt(button.dataset.id, button.id),
  "submit-practice": submitPractice,
  "add-claim": addClaim,
  "remove-claim"() {
    const item = state.own.claims[activeClaim];
    if ((item.text.trim() || item.evidence.length) && !window.confirm("Удалить это утверждение вместе с его источниками?")) return;
    state.own.claims.splice(activeClaim, 1);
    activeClaim = Math.max(0, Math.min(activeClaim, state.own.claims.length - 1));
    addingEvidence = false;
    save();
    render(state.own.claims.length ? `claim-select-${activeClaim}` : "add-claim");
  },
  "add-evidence"() {
    addingEvidence = true;
    render("own-source-name");
  },
  "cancel-evidence"() {
    addingEvidence = false;
    delete state.own.claims[activeClaim].pendingEvidence;
    save();
    render("add-evidence");
  },
  "remove-own-evidence"(button) {
    state.own.claims[activeClaim].evidence.splice(Number(button.dataset.id), 1);
    save();
    render(addingEvidence ? "own-source-name" : "add-evidence");
  },
  "save-own": saveOwn,
  download: (button) => download(state.history.find((entry) => entry.id === button.dataset.id)),
  retry(button) {
    const item = cases.find((candidate) => candidate.id === button.dataset.id);
    state.drafts[item.id] = startDraft(item);
    save();
    if (tab === "case") navigate();
    else location.hash = `case/${item.id}`;
  },
};

main.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  validation = "";
  const message = document.getElementById("validation");
  if (message) message.textContent = "";
  actions[button.dataset.action](button);
});

main.addEventListener("input", (event) => {
  const input = event.target;
  const field = input.dataset.field;
  if (!field || input.type === "radio" || input.type === "checkbox") return;
  if (field === "rewrite") state.drafts[currentCase.id].rewrite = input.value;
  else if (field.startsWith("evidence-")) {
    const item = state.own.claims[activeClaim];
    item.pendingEvidence ??= {};
    item.pendingEvidence[input.name] = input.value;
  }
  else if (field === "claim-text") {
    state.own.claims[activeClaim].text = input.value;
    document.getElementById(`own-claim-label-${activeClaim}`).textContent = input.value.trim().slice(0, 90) || "Новое утверждение";
  } else state.own[field] = input.value;
  save();
});

main.addEventListener("change", (event) => {
  const input = event.target;
  const field = input.dataset.field;
  if (field === "challenge") state.challenge = input.checked;
  else if (field === "verdict") state.drafts[currentCase.id].selections[activeClaim].verdict = input.value;
  else if (field === "own-verdict") state.own.claims[activeClaim].verdict = input.value;
  else if (field === "decision") state.drafts[currentCase.id].decision = input.value;
  else return;
  save();
  if (field === "verdict" || field === "own-verdict") {
    const value = input.value;
    render();
    main.querySelector(`[data-field="${field}"][value="${value}"]`).focus();
  }
});

main.addEventListener("submit", (event) => {
  if (event.target.id !== "own-evidence-form") return;
  event.preventDefault();
  const fields = new FormData(event.target);
  const source = fields.get("source").trim();
  const quote = fields.get("quote").trim();
  if (!source || !quote) {
    say("Введите название или ссылку и непустой фрагмент источника.");
    event.target.elements[source ? "quote" : "source"].focus();
    return;
  }
  const item = state.own.claims[activeClaim];
  item.evidence.push({ source, quote });
  delete item.pendingEvidence;
  addingEvidence = false;
  save();
  render("add-evidence");
  say("Источник прикреплён.");
});

const fullscreen = document.getElementById("app-fullscreen");
if (document.fullscreenEnabled) {
  fullscreen.hidden = false;
  fullscreen.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      say("Браузер не разрешил полноэкранный режим.");
    }
  });
  document.addEventListener("fullscreenchange", () => {
    const label = document.fullscreenElement ? "Выйти из полноэкранного режима" : "Развернуть приложение на весь экран";
    fullscreen.setAttribute("aria-label", label);
    fullscreen.title = label;
  });
}

window.addEventListener("hashchange", () => navigate());
document.querySelector(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  focus("content");
});
navigate(false);
