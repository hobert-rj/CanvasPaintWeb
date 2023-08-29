const paintBrushRange = document.querySelector('#paintSizeRange'),
  paintSizeVal = document.querySelector('#paintSizeVal'),
  paintContainer = document.querySelector('#paintContainer'),
  paintAdd = document.querySelector('#paintAdd'),
  paintCanvas = document.querySelector('#paintDraw'),
  paintColorInput = document.querySelector('#paintColorInput'),
  paintResetBtn = document.querySelector('#paintReset'),
  paintSaveBtn = document.querySelector('#paintSave'),
  paintBtn = document.querySelector('#paintBtn'),
  paintToolBar = document.querySelector('#paintToolBar'),
  paintTabsCon = document.querySelector('#paintTabsCon'),
  paintColorCon = document.querySelector('#paintColorCon'),
  paintTools = document.querySelectorAll('#paintTools span'),
  paintColors = document.querySelectorAll('#paintColors span');

const paintQuality = 2,
  paintFrequency = 1,
  paintMinMovement = 5,
  paintBackground = 'white',
  paintCtx = paintCanvas.getContext('2d'),
  paintCalcQuality = (val) => val * paintQuality,
  paintNotMove = (x, y) => {
    const x2 = Math.abs(paintLastX - x),
      y2 = Math.abs(paintLastY - y);
    return x2 * x2 + y2 * y2 < paintMinMovement;
  },
  getPaintTabs = () => document.querySelectorAll('.paintTab');

let paintData = {},
  paintBrushSize = {
    pencil: 15,
    eraser: 100,
    brush: 15,
  },
  paintCurrentColor = 'black',
  paintCurrentLineCap = 'round',
  paintCurrentTool = 'brush',
  paintDrawing = false,
  paintLastX = 0,
  paintLastY = 0,
  paintRect = '',
  paintInitialDataUrl,
  paintSelectedId = 1,
  paintCycles = paintFrequency,
  paintTabs = getPaintTabs(),
  paintTabsCreated = 1;

// Run once at first
function paintInit() {
  paintCanvas.height = paintCalcQuality(paintContainer.offsetHeight);
  paintCanvas.width = paintCalcQuality(paintContainer.offsetWidth);
  paintClearTab();
  paintInitialDataUrl = paintGetDataUrl();
  paintSelectedId = 1;
  paintData[paintSelectedId] = paintInitialDataUrl;

  //event listeners
  window.addEventListener('resize', paintReSize);
  paintContainer.addEventListener('resize', paintReSize);

  paintBrushRange.addEventListener('input', () => {
    const val =
      typeof paintBrushRange.value === 'string'
        ? parseInt(paintBrushRange.value)
        : paintBrushRange.value;
    paintBrushSize[paintCurrentTool] = val;
    paintSizeVal.innerHTML = val;
    paintCtx.lineWidth = val;
  });
  paintColorInput.addEventListener('change', paintPickColor);
  paintColorInput.addEventListener('input', paintPickColor);
  paintSaveBtn.addEventListener('click', paintSaveImg);
  paintResetBtn.addEventListener('click', paintClearTab);

  paintTools.forEach((tool) => tool.addEventListener('click', paintSetTool));
  paintColors.forEach((color) => color.addEventListener('click', paintSelectColor));
  paintTabs.forEach((tab) => tab.addEventListener('click', paintSelectTab));
  paintBtn.addEventListener('click', paintToggle);
  paintAdd.addEventListener('click', paintNewTab);

  paintCanvas.addEventListener('mousedown', paintStartDraw);
  paintCanvas.addEventListener('mousemove', paintContinueDraw);
  paintCanvas.addEventListener('mouseup', () => (paintDrawing = false));
  paintCanvas.addEventListener('touchstart', paintStartDraw);
  paintCanvas.addEventListener('touchmove', paintContinueDraw);
  paintCanvas.addEventListener('touchend', () => (paintDrawing = false));
}

function paintReSize() {
  try {
    const temp = paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
    paintCanvas.height = paintCalcQuality(paintContainer.offsetHeight);
    paintCanvas.width = paintCalcQuality(paintContainer.offsetWidth);
    paintCtx.putImageData(temp, 0, 0);
  } catch { }
  paintCtx.lineWidth = paintBrushSize[paintCurrentTool];
  paintSizeVal.innerHTML = paintBrushSize[paintCurrentTool];
  paintBrushRange.value = paintBrushSize[paintCurrentTool];
  paintCtx.lineCap = paintCurrentLineCap;
  paintCtx.strokeStyle = paintCurrentTool === 'eraser' ? paintBackground : paintCurrentColor;
  paintCycles = 0;
};

function paintContinueDraw(e) {
  e.preventDefault();
  if (!paintDrawing) return;

  if (paintCycles < paintFrequency) {
    paintCycles++;
    return;
  }

  const x = paintCalcQuality(e.touches ? e.touches[0].pageX - paintRect.left : e.offsetX),
    y = paintCalcQuality(e.touches ? e.touches[0].pageY - paintRect.top : e.offsetY);

  if (paintNotMove(x, y)) {
    return
  }

  paintCtx.beginPath();
  paintCtx.moveTo(paintLastX, paintLastY);
  paintCtx.lineTo(x, y);
  paintLastX = x;
  paintLastY = y;
  paintCtx.stroke();
  paintCycles = 0;
};

function paintStartDraw(e) {
  e.preventDefault();
  const target = e.target || e.srcElement;
  paintRect = target.getBoundingClientRect();
  paintDrawing = true;
  paintLastX = paintCalcQuality(e.touches ? e.touches[0].pageX - paintRect.left : e.offsetX);
  paintLastY = paintCalcQuality(e.touches ? e.touches[0].pageY - paintRect.top : e.offsetY);
  paintCtx.beginPath();
  paintCtx.moveTo(paintLastX, paintLastY);
  paintCtx.lineTo(paintLastX, paintLastY);
  paintCtx.stroke();
  paintCycles = paintFrequency;
  paintContinueDraw(e);
};

function paintSelectColor() {
  paintCurrentColor = this.dataset.color;
  paintCtx.strokeStyle = paintCurrentTool !== 'eraser' ? paintCurrentColor : paintBackground;
  paintColors.forEach((color) =>
    color === this
      ? color.classList.add('active-color')
      : color.classList.remove('active-color')
  );
}

function paintPickColor() {
  if (paintCurrentColor === this.value)
    return

  paintCurrentColor = this.value;
  paintCtx.strokeStyle = paintCurrentTool !== 'eraser' ? paintCurrentColor : paintBackground;
  paintColors.forEach((color) => color.classList.remove('active-color'));
}

function paintSetTool() {
  paintCurrentTool = this.dataset.name;
  paintCtx.lineWidth = paintBrushSize[paintCurrentTool];
  paintSizeVal.innerHTML = paintBrushSize[paintCurrentTool];
  paintBrushRange.value = paintBrushSize[paintCurrentTool];
  paintTools.forEach((tool) =>
    tool === this
      ? tool.classList.add('active-tool')
      : tool.classList.remove('active-tool')
  );
  paintCurrentLineCap = paintCurrentTool === 'pencil' ? 'square' : 'round';
  paintCtx.lineCap = paintCurrentLineCap;
  paintCtx.strokeStyle = paintCurrentTool === 'eraser' ? paintBackground : paintCurrentColor;
  paintColorCon.style.display = paintCurrentTool === 'eraser' ? 'none' : '';
}

function paintSaveImg(e) {
  if (paintInitialDataUrl === paintGetDataUrl()) return e.preventDefault();

  this.download = prompt('Enter image name :');
  if (this.download === 'null') return e.preventDefault();

  this.href = paintCanvas.toDataURL('image/png');
}

function paintToggle() {
  if (paintBtn.classList.contains('show')) {
    paintBtn.classList.remove('show');
    paintToolBar.style.display = 'none';
  } else {
    paintBtn.classList.add('show');
    paintToolBar.style.display = '';
  }
}

function paintSetDataUrl(src) {
  const img = new Image();
  img.onload = function () {
    paintCtx.drawImage(img, 0, 0);
  };
  img.src = src;
}

function paintGetDataUrl() {
  return paintCanvas.toDataURL('image/png');
}

function paintNewTab() {
  const newId = ++paintTabsCreated;

  paintCreateTab(newId).classList.add('active');

  paintData[paintSelectedId] = paintGetDataUrl();
  paintData[newId] = '';
  paintSelectedId = newId;
  paintTabs.forEach((tab) => tab.classList.remove('active'));
  paintSetDataUrl(paintInitialDataUrl);
  paintTabs = getPaintTabs();
}

function paintCreateTab(newId) {
  const newNode = document.createElement('li');
  newNode.classList.add('paintTab');
  newNode.dataset.id = newId;
  newNode.innerHTML = `<label>Image ${newId}</label><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 512 512'><polygon points='400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49'></polygon></svg>`;
  paintTabsCon.append(newNode)
  newNode.addEventListener('click', paintSelectTab);
  return newNode;
}

function paintSelectTab(e, id) {
  if (id === undefined)
    id = parseInt(this.dataset.id);

  if (e) {
    const target = e.target || e.srcElement;

    if (target instanceof SVGElement) {
      paintDeleteTab(id);
      return
    }
  }

  if (paintSelectedId === id) return

  paintData[paintSelectedId] = paintGetDataUrl();
  paintSelectedId = id;
  for (const item of paintTabs) {
    if (parseInt(item.dataset.id) === paintSelectedId)
      item.classList.add('active')
    else
      item.classList.remove('active')
  }
  paintClearTab();
  paintSetDataUrl(paintData[paintSelectedId]);
}

function paintClearTab(e) {
  if (e) {
    if (paintInitialDataUrl === paintGetDataUrl()) return;

    if (!confirm('Are you sure you want to clear the page?')) return;
    paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
  }

  paintCtx.fillStyle = paintBackground;
  paintCtx.lineCap = paintCurrentLineCap;
  paintCtx.lineWidth = paintBrushSize[paintCurrentTool];
  paintCtx.strokeStyle = paintCurrentTool === 'eraser' ? paintBackground : paintCurrentColor;
  paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
}

function paintDeleteTab(id) {
  if (!confirm(`Are you sure you want to delete Image ${id}?`)) return;

  if (Object.keys(paintData).length <= 1) {
    paintNewTab();
  }

  if (paintSelectedId === id) {
    paintSelectTab(undefined, paintFindNextId(id - 1, (newId) => newId !== id));
  }

  for (const item of paintTabs) {
    if (parseInt(item.dataset.id) === id) {
      item.remove();
      break
    }
  }

  paintTabs = getPaintTabs();

  delete paintData[id];
}

function paintFindNextId(nextId, condition = (newId) => true) {
  if (!paintData[nextId]) {
    for (const key of Object.keys(paintData)) {
      const newId = parseInt(key);
      if (condition(newId)) {
        nextId = newId;
        break;
      }
    }
  }
  return nextId;
}

// Get paint data as Json to be saved
function paintGetJson() {
  paintData[paintSelectedId] = paintGetDataUrl();
  return JSON.stringify(paintData);
}

// Set Json data to paint
function paintSetJson(arr, startingId = 1) {
  const temp = JSON.parse(arr);
  if (temp) {
    paintData = temp;
    paintTabsCon.textContent = '';
    for (key in paintData) {
      paintCreateTab(key);
    }
    paintTabs = getPaintTabs();
    paintSelectTab(undefined, paintFindNextId(startingId));
  }
}

// start
paintInit();
