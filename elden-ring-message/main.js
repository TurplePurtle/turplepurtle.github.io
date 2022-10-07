/** @type {HTMLSelectElement[]} */
const twoWords = [
  document.querySelector("#select-template2-label"),
  document.querySelector("#select-word2-label"),
];

/** @type {HTMLSelectElement} */
const selectTemplate = document.querySelector("#select-template");
/** @type {HTMLSelectElement} */
const selectTemplate2 = document.querySelector("#select-template2");
/** @type {HTMLSelectElement} */
const selectWord = document.querySelector("#select-word");
/** @type {HTMLSelectElement} */
const selectWord2 = document.querySelector("#select-word2");
/** @type {HTMLSelectElement} */
const selectConjunction = document.querySelector("#select-conjunction");
/** @type {HTMLElement} */
const messageContainer = document.querySelector("#message-container");
/** @type {HTMLButtonElement} */
const randomizeButton = document.querySelector("#randomize-button");

for (const template of messages.templates) {
  const option = document.createElement("option");
  option.value = template;
  option.innerHTML = template;
  selectTemplate.appendChild(option);
  selectTemplate2.appendChild(option.cloneNode(true));
}

for (const category of messages.words) {
  const optGroup = document.createElement("optgroup");
  optGroup.label = category.category;
  for (const word of category.words) {
    const option = document.createElement("option");
    option.value = word;
    option.innerHTML = word;
    optGroup.appendChild(option);
  }
  selectWord.appendChild(optGroup);
  selectWord2.appendChild(optGroup.cloneNode(true));
}

for (const conjunction of messages.conjunctions) {
  const option = document.createElement("option");
  option.value = conjunction;
  option.innerHTML = conjunction;
  selectConjunction.appendChild(option);
}

function update() {
  const pattern = /\*\*\*\*/g;
  const hasConjunction = selectConjunction.value !== "";
  twoWords.forEach((el) => el.classList.toggle("hidden", !hasConjunction));
  const template = selectTemplate.value;
  const word = selectWord.value;
  const conjunction = selectConjunction.value;
  const template2 = selectTemplate2.value;
  const word2 = selectWord2.value;
  const message = template.replace(pattern, word);
  const message2 = hasConjunction
    ? ` ${conjunction} ${template2.replace(pattern, word2)}`
    : "";
  messageContainer.innerHTML = message + message2;
}

function randInt(end) {
  return Math.random() * end | 0;
}

function randItem(arr) {
  return arr[randInt(arr.length)];
}

function randomize() {
  selectTemplate.value = randItem(messages.templates);
  selectWord.value = randItem(randItem(messages.words).words);
  selectConjunction.value = randItem(messages.conjunctions);
  selectTemplate2.value = randItem(messages.templates);
  selectWord2.value = randItem(randItem(messages.words).words);
  update();
}

[
  selectTemplate,
  selectTemplate2,
  selectWord,
  selectWord2,
  selectConjunction,
].forEach((el) => el.addEventListener("change", update));

randomizeButton.addEventListener("click", randomize);

randomize();
