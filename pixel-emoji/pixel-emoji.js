const white = '⬜️';
const black = '⬛️';
const inputWidth = document.getElementById('input-width');
const inputHeight = document.getElementById('input-height');
const canvas = document.getElementById('canvas');
const output = document.getElementById('output');
let currentWidth = 0;
let currentHeight = 0;

function cellClick(e) {
  e.target.classList.toggle('black');
  updateOutput();
}

function createCell() {
  const cell = document.createElement('div');
  cell.classList.add('cell');
  cell.addEventListener('click', cellClick);
  return cell;
}

/**
 * @param {number} width
 * @param {number} height
 */
function setCanvasResolution(width, height) {
  const deltaHeight = height - currentHeight;
  const deltaWidth = width - currentWidth;

  for (let i = 0; i < -deltaHeight; i++) {
    canvas.lastElementChild.remove();
  }
  for (let i = 0; i < currentHeight; i++) {
    const row = canvas.children[i];
    for (let j = 0; j < -deltaWidth; j++) {
      row.lastElementChild.remove();
    }
    for (let j = 0; j < deltaWidth; j++) {
      row.appendChild(createCell());
    }
  }
  for (let i = 0; i < deltaHeight; i++) {
    const row = document.createElement('div');
    row.classList.add('row');
    canvas.appendChild(row);
    for (let j = 0; j < width; j++) {
      row.appendChild(createCell());
    }
  }

  currentWidth = width;
  currentHeight = height;
  updateOutput();
}

function updateOutput() {
  let str = '';
  for (const row of canvas.children) {
    for (const cell of row.children) {
      str += cell.classList.contains('black') ? black : white;
    }
    str += '<br>';
  }
  output.innerHTML = str;
}

function validResolutionValue(value) {
  return Number.isFinite(value) && value > 0;
}

inputWidth.addEventListener('change', function(e) {
  /** @type {HTMLInputElement} */
  const value = Number(e.target.value);
  if (validResolutionValue(value)) {
    setCanvasResolution(value, currentHeight);
  } else {
    e.target.value = currentWidth;
  }
});

inputHeight.addEventListener('change', function(e) {
  /** @type {HTMLInputElement} */
  const value = Number(e.target.value);
  if (validResolutionValue(value)) {
    setCanvasResolution(currentWidth, value);
  } else {
    e.target.value = currentHeight;
  }
});


setCanvasResolution(12, 12);
inputWidth.value = currentWidth;
inputHeight.value = currentHeight;
updateOutput();
