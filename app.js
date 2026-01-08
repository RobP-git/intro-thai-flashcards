const STORAGE_KEY = "thaiFlashcards.gender";

const pages = {
  home: initHome,
  overview: initOverview,
  learn: initLearn,
  edit: initEdit,
};

const currentPage = document.body?.dataset?.page;
if (currentPage && pages[currentPage]) {
  pages[currentPage]();
}

function initHome() {
  const buttons = document.querySelectorAll(".toggle");
  const selected = document.getElementById("selected-gender");
  const actions = document.querySelectorAll(".actions .action");
  const saved = getSavedGender();

  if (saved) {
    highlightSelection(saved, buttons, selected);
    enableActions(actions);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const gender = button.dataset.gender;
      localStorage.setItem(STORAGE_KEY, gender);
      highlightSelection(gender, buttons, selected);
      enableActions(actions);
    });
  });
}

function initOverview() {
  const list = document.getElementById("overview-list");
  const notice = document.getElementById("gender-notice");
  const gender = getSavedGender();
  const filtered = filterByGender(WORD_SETS, gender);

  if (!gender) {
    notice.hidden = false;
  }

  list.innerHTML = "";
  filtered.forEach((word) => {
    const card = document.createElement("article");
    card.className = "word-card";
    card.appendChild(buildWordContent(word));
    list.appendChild(card);
  });
}

function initLearn() {
  const list = document.getElementById("learn-list");
  const notice = document.getElementById("gender-notice");
  const gender = getSavedGender();
  const filtered = filterByGender(WORD_SETS, gender);

  if (!gender) {
    notice.hidden = false;
  }

  list.innerHTML = "";
  filtered.forEach((word) => {
    const card = document.createElement("article");
    card.className = "word-card";

    const english = document.createElement("p");
    english.className = "english";
    english.textContent = word.english;

    const thai = document.createElement("p");
    thai.className = "thai hidden";
    thai.textContent = word.thai;

    const reveal = document.createElement("button");
    reveal.className = "reveal";
    reveal.type = "button";
    reveal.textContent = "Show Thai";
    reveal.addEventListener("click", () => {
      thai.classList.toggle("hidden");
      reveal.textContent = thai.classList.contains("hidden") ? "Show Thai" : "Hide Thai";
    });

    const audio = buildAudioButton(word);

    card.appendChild(english);
    card.appendChild(thai);
    card.appendChild(reveal);
    card.appendChild(audio);
    list.appendChild(card);
  });
}

function initEdit() {
  const list = document.getElementById("editor-list");
  const output = document.getElementById("json-output");
  const addButton = document.getElementById("add-word");
  const exportButton = document.getElementById("export-json");

  let workingCopy = WORD_SETS.map((word) => ({ ...word }));

  const render = () => {
    list.innerHTML = "";
    workingCopy.forEach((word, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "editor-row";

      wrapper.appendChild(buildEditorField("English", word.english, (value) => {
        word.english = value;
      }));

      wrapper.appendChild(buildEditorField("Thai", word.thai, (value) => {
        word.thai = value;
      }));

      wrapper.appendChild(buildEditorField("Audio index", word.audioIndex, (value) => {
        word.audioIndex = Number(value) || 0;
      }, "number"));

      wrapper.appendChild(buildEditorSelect(word.gender, (value) => {
        word.gender = value;
      }));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        workingCopy.splice(index, 1);
        render();
      });

      wrapper.appendChild(remove);
      list.appendChild(wrapper);
    });
  };

  addButton.addEventListener("click", () => {
    workingCopy.push({
      english: "New word",
      thai: "ใหม่",
      audioIndex: 0,
      gender: "all",
    });
    render();
  });

  exportButton.addEventListener("click", () => {
    output.value = JSON.stringify(workingCopy, null, 2);
  });

  render();
}

function highlightSelection(gender, buttons, selectedLabel) {
  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.gender === gender);
  });
  selectedLabel.textContent = `Saved as: ${gender}`;
}

function enableActions(actions) {
  actions.forEach((action) => {
    const link = action.dataset.href;
    if (link) {
      action.href = link;
    }
    action.classList.remove("disabled");
    action.removeAttribute("aria-disabled");
  });
}

function getSavedGender() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "man" || saved === "woman") {
    return saved;
  }
  return null;
}

function filterByGender(words, gender) {
  if (!gender) {
    return words;
  }
  return words.filter((word) => word.gender === "all" || word.gender === gender);
}

function buildWordContent(word) {
  const container = document.createElement("div");

  const english = document.createElement("p");
  english.className = "english";
  english.textContent = word.english;

  const thai = document.createElement("p");
  thai.className = "thai";
  thai.textContent = word.thai;

  const audio = buildAudioButton(word);

  container.appendChild(english);
  container.appendChild(thai);
  container.appendChild(audio);

  return container;
}

function buildAudioButton(word) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "audio";
  button.textContent = "Play audio";

  const audioPath = getAudioPath(word);
  const audio = new Audio(audioPath);
  audio.preload = "none";

  button.addEventListener("click", () => {
    audio.currentTime = 0;
    audio.play();
  });

  return button;
}

function getAudioPath(word) {
  if (word.gender === "man") {
    return `audio/${word.audioIndex}-man.mp3`;
  }
  if (word.gender === "woman") {
    return `audio/${word.audioIndex}-woman.mp3`;
  }
  return `audio/${word.audioIndex}.mp3`;
}

function buildEditorField(labelText, value, onChange, type = "text") {
  const label = document.createElement("label");
  label.className = "field";

  const span = document.createElement("span");
  span.textContent = labelText;

  const input = document.createElement("input");
  input.type = type;
  input.value = value;
  input.addEventListener("input", (event) => onChange(event.target.value));

  label.appendChild(span);
  label.appendChild(input);
  return label;
}

function buildEditorSelect(value, onChange) {
  const label = document.createElement("label");
  label.className = "field";

  const span = document.createElement("span");
  span.textContent = "Gender";

  const select = document.createElement("select");
  ["all", "man", "woman"].forEach((optionValue) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionValue;
    if (optionValue === value) {
      option.selected = true;
    }
    select.appendChild(option);
  });
  select.addEventListener("change", (event) => onChange(event.target.value));

  label.appendChild(span);
  label.appendChild(select);
  return label;
}
