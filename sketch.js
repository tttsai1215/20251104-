/*
 * 最終整合版程式碼 (2025/11/04 - v4)
 * 包含：
 * 1. Genuary 1 視覺化主頁 (mode: 'main')
 * 2. 爆破氣球動畫 (mode: 'balloons')
 * 3. p5.js 測驗系統 (mode: 'quiz')
 * 4. 點擊式開關選單 (Toggle Menu)
 */

// ===================================
// == 0. 選單控制變數 ==
// ===================================
let isMenuOpen = false; // 追蹤選單是否開啟
const menuButtonArea = { x: 0, y: 0, w: 120, h: 120 }; // 選單按鈕的熱區


// ===================================
// == 1. 主頁 (Sketch 1) 的全域變數 ==
// ===================================
let mover = [];
let num;
let rnum;
let points;
let count = 3;
let w;
let pg; // 主頁的紋理
let mode = 'main'; // 這是「主程式」的模式

// 選單設定 (已更新)
const menuX = 25;
const menuY = 25;
const menuW = 220;
const menuH = 40;
const menuItems = [
  "爆破氣球",
  "爆破氣球的講義",
  "回到主頁",
  "測驗卷",
  "測驗卷筆記",
  "教科系"
];
const menuLinks = [
  "https://tttsai1215.github.io/20251014new/", // 爆破氣球
  "https://hackmd.io/@3OvxlZiGSxyFx5MGHXqTYQ/H1Y4qu1nge", // 氣球講義
  "", // 回到主頁 (內部控制)
  "", // 測驗卷 (內部控制)
  "https://hackmd.io/@3OvxlZiGSxyFx5MGHXqTYQ/Byt45Jvybe/edit", // 測驗筆記
  "https://www.et.tku.edu.tw/" // 教科系
];


// ===================================
// == 2. 測驗 (Sketch 2) 的全域變數 ==
// ===================================
let quiz_questionTable;
let quiz_allQuestions = [];
let quiz_quizQuestions = []; // 儲存本次測驗的5個題目
let quiz_currentQuestionIndex = 0;
let quiz_score = 0;
let quiz_gameState = 'START'; // 這是「測驗」的內部狀態

// 測驗按鈕物件
let quiz_answerButtons = [];
let quiz_startButton, quiz_restartButton;

// 測驗背景粒子 (裝飾)
let quiz_bgParticles = [];

// 測驗煙火系統
let quiz_fireworks = [];
let quiz_fireworksTimer = 0;

// 測驗回饋
let quiz_feedbackMessage = '';
let quiz_feedbackColor;
let quiz_feedbackTimer = 0;


// ===================================
// == 3. p5.js 主函數 (整合版) ==
// ===================================

// 唯一的 preload()：載入測驗題庫
function preload() {
  // 嘗試載入 csv，使用成功/失敗回呼以便紀錄
  quiz_questionTable = loadTable('questions.csv', 'csv', 'header',
    () => console.log('questions.csv 載入成功'),
    (err) => console.error('questions.csv 載入失敗', err)
  );
}

// 唯一的 setup()：初始化主頁
function setup() {
  // --- 主頁 (Sketch 1) 的 Setup ---
  rnum = random(100);
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  w = min(windowWidth, windowHeight) / count;
  let radius = w / 2;
  points = 4;
  num = 360 / points;

  mover = [];
  for (let j = 0; j < points; j++) {
    let ang = j * (360 / points);
    let ex = radius * sin(ang);
    let ey = radius * cos(ang);
    let ex2 = radius * sin(ang + 45);
    let ey2 = radius * cos(ang + 45);
    mover.push(new Mover(ex, ey, ex2, ey2, radius, j));
  }

  // 建立主頁的 rain texture
  createMainPageTexture();

  // --- 測驗 (Sketch 2) 的 Setup ---
  // 我們在 setup() 時就先初始化測驗的資料
  // 這樣能確保 CSV 載入失敗時，備援題庫也能正常運作
  initializeQuiz();
}

// 唯一的 draw()：主路由 (已更新選單邏輯)
function draw() {
  // 根據不同的主模式，呼叫不同的繪圖函數
  if (mode === 'main') {
    drawMainScene();
  } else if (mode === 'balloons') {
    drawBalloonsScene();
  } else if (mode === 'quiz') {
    // 當模式是 'quiz' 時，呼叫測驗的主繪圖函數
    drawQuiz();
  }

  // ====== 永遠在最上層繪製選單 (點擊觸發) ======

  // 1. 畫一個 "MENU" 按鈕提示
  push();
  fill(255, 50); // 半透明
  noStroke();
  if (isMenuOpen) {
    // 選單開啟時，按鈕範圍大一點 (蓋住整個選單)
    fill(0, 50); // 陰影
    rect(0, 0, width, height);
  } else {
    // 選單關閉時，只畫小按鈕
    rect(menuButtonArea.x, menuButtonArea.y, 60, 40, 5); 
  }
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text("MENU", 10, 10);
  pop();

  // 2. 如果選單狀態為 "開啟"，才呼叫 showMenu()
  if (isMenuOpen) {
    showMenu();
  }
}

// 唯一的 mousePressed()：主路由 (已更新為 Toggle 邏輯)
function mousePressed() {
  
  // 1. 檢查是否點擊了「選單項目」
  if (isMenuOpen && mouseX < menuW) {
    let itemClicked = checkMenuItemClick();
    if (itemClicked.clicked) {
      handleMenuItemClick(itemClicked.index); // 執行動作
      isMenuOpen = false; // 點完後關閉選單
      return; // 結束
    }
  }

  // 2. 檢查是否點擊了「選單熱區」 (左上角)
  if (mouseX > menuButtonArea.x && mouseX < menuButtonArea.w &&
      mouseY > menuButtonArea.y && mouseY < menuButtonArea.h) {
    
    isMenuOpen = !isMenuOpen; // 反轉選單狀態 (開 -> 關, 關 -> 開)
    return; // 結束
  }
  
  // 3. 如果點擊了「選單以外」的區域，就關閉選單
  if (isMenuOpen && mouseX > menuW) {
    isMenuOpen = false;
    // (注意：這裡不 return，因為可能要觸發測驗按鈕)
  }

  // 4. 如果沒有任何選單被觸發，則將點擊事件交給「當前模式」
  if (mode === 'quiz' && !isMenuOpen) { // 只有在選單關閉時才觸發遊戲
    // 如果在測驗模式，就呼叫測驗的點擊函數
    mousePressedQuiz();
  }
}


// 唯一的 windowResized()：只在主頁模式時作用
function windowResized() {
  // 只有主頁 (main) 模式才允許調整視窗大小
  if (mode === 'main') {
    resizeCanvas(windowWidth, windowHeight);
    // 重新建立 rain texture
    createMainPageTexture();
    // 重新計算主頁視覺的參數
    w = min(windowWidth, windowHeight) / count;
  }
}


// ===================================
// == 4. 主頁 (Sketch 1) 的輔助函數 ==
// ===================================

// 建立主頁背景紋理
function createMainPageTexture() {
  pg = createGraphics(width, height);
  pg.noFill();
  for (let i = 0; i < 3000; i++) {
    let x = random(width);
    let y = random(height);
    let n = noise(x * 0.01, y * 0.01) * width * 0.01;
    pg.stroke(100);
    pg.line(x, y, x, y + n);
  }
}

// 繪製主頁
function drawMainScene() {
  background(51);
  image(pg, 0, 0);

  randomSeed(rnum);
  tile();

  // ====== 顯示中央標題 ======
  push();
  textAlign(CENTER, CENTER);
  let baseSize = 96;
  let scaleFactor = max(width, height) / 1000;
  textSize(baseSize * scaleFactor);
  stroke(0, 180); // 黑色陰影
  strokeWeight(8);
  fill(255); // 白色字
  text("414730134\n蔡忞序", width / 2, height / 2);
  pop();
}

// 繪製主頁的平鋪圖形
function tile() {
  const baseStep = 60;
  const baseGrid = 10;
  const short = min(width, height);
  const step = baseStep * (short / (baseGrid * baseStep));
  const cols = ceil(width / step) + 1;
  const rows = ceil(height / step) + 1;
  const totalW = cols * step;
  const totalH = rows * step;
  const dx = (width - totalW) / 2;
  const dy = (height - totalH) / 2;

  push();
  translate(dx, dy);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      push();
      translate(i * step, j * step);
      let idx = (i + j) % mover.length;
      mover[idx].displayAt(0, 0);
      pop();
    }
  }
  pop();
}

// 顯示選單 (已更新為動態高度)
function showMenu() {
  push();
  noStroke();
  fill(30, 200);
  // 自動計算選單高度
  let menuTotalH = 40 + menuItems.length * (menuH + 12);
  rect(0, 0, menuW, menuTotalH);

  textSize(18);
  fill(255);
  textAlign(LEFT, TOP);
  let y = 30;
  for (let i = 0; i < menuItems.length; i++) {
    // 按鈕外觀
    fill(255, 20);
    rect(10, y - 6, menuW - 20, menuH);
    fill(255);
    noStroke();
    text(menuItems[i], 20, y);
    y += menuH + 12;
  }
  pop();
}

// 主頁的 Mover 類別
class Mover {
  constructor(x1, y1, x2, y2, radius, id) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.r = radius;
    this.id = id;
    if (id % 2 === 0) {
      this.col = color(255, 255, 255); // 白色
    } else {
      this.col = color(180, 220, 255); // 淺藍
    }
  }

  displayAt(dx, dy) {
    push();
    translate(dx, dy);
    noStroke();
    fill(this.col);
    ellipse(this.x1 + this.r, this.y1 + this.r, this.r * 0.6);
    ellipse(this.x2 + this.r, this.y2 + this.r, this.r * 0.4);
    stroke(255, 30);
    line(this.x1 + this.r, this.y1 + this.r, this.x2 + this.r, this.y2 + this.r);
    pop();
  }
}

// --- 爆破氣球功能 ---
let circles = [];
let particles = [];
const palette = [
  [230, 180, 255],
  [200, 150, 250],
  [160, 200, 255],
  [140, 170, 255],
  [120, 190, 230]
];

function startBalloons() {
  mode = 'balloons';
  // 確保畫布是全螢幕
  resizeCanvas(windowWidth, windowHeight);
  windowResized();
  
  circles = [];
  particles = [];
  for (let i = 0; i < 12; i++) {
    let baseColor = palette[int(random(palette.length))];
    let r = random(50, 200);
    circles.push({
      x: random(width),
      y: random(height, height * 1.5),
      r: r,
      c: [baseColor[0], baseColor[1], baseColor[2], random(120, 200)]
    });
  }
  // 進入爆破循環（短暫）
  let duration = 6000;
  setTimeout(() => {
    // 只有在 6 秒後還在 'balloons' 模式才切換回 'main'
    // (避免使用者手動切換到 quiz 模式時被蓋掉)
    if (mode === 'balloons') {
      mode = 'main';
    }
  }, duration);
}

function drawBalloonsScene() {
  background(200, 182, 255);
  noStroke();
  for (let i = 0; i < circles.length; i++) {
    let c = circles[i];
    fill(c.c[0], c.c[1], c.c[2], c.c[3]);
    ellipse(c.x, c.y, c.r, c.r);
    let speed = map(c.r, 50, 300, 6, 1);
    c.y -= speed * 0.6;
    if (c.y < -c.r / 2) {
      c.y = height + c.r / 2;
    }
  }
}


// ===================================
// == 5. 測驗 (Sketch 2) 的輔助函數 ==
// == (全部加上 quiz_ 前綴) ==
// ===================================

// 這是從 Sketch 2 的 setup() 移過來的
function initializeQuiz() {
  // **注意：這裡沒有 createCanvas()**

  // 如果 CSV 未載入或沒有資料，使用備援題庫
  if (!quiz_questionTable || typeof quiz_questionTable.getRowCount !== 'function' || quiz_questionTable.getRowCount() === 0) {
    console.warn('questions.csv 未載入或無資料，使用備援題庫（偵錯用）。');
    quiz_allQuestions = [
      { question: '測試題：1 + 1 = ?', opA: '1', opB: '2', opC: '3', opD: '4', correct: 'B' },
      { question: '測試題：2 + 2 = ?', opA: '2', opB: '3', opC: '4', opD: '5', correct: 'C' },
      { question: '測試題：3 + 3 = ?', opA: '5', opB: '6', opC: '7', opD: '8', correct: 'B' },
      { question: '測試題：4 + 1 = ?', opA: '4', opB: '5', opC: '6', opD: '7', correct: 'B' },
      { question: '測試題：5 + 0 = ?', opA: '5', opB: '4', opC: '3', opD: '2', correct: 'A' }
    ];
  } else {
    // 正常情況：從 CSV 產生題庫
    processDataQuiz();
  }

  // 共用初始化
  setupBgParticlesQuiz();
  setupButtonsQuiz();
  startGameQuiz();

  console.log('Quiz initialized for canvas size ' + width + 'x' + height);
}

// 這是從 Sketch 2 的 draw() 移過來的
function drawQuiz() {
  // 淺藍背景
  background(173, 216, 230);
  drawBgParticlesQuiz();

  // 顯示左上學號（若需要可移除）
  push();
  fill(0);
  textSize(16);
  textAlign(LEFT, TOP);
  text('414730134', 10, 10);
  pop();

  // 根據不同的「測驗」遊戲狀態繪製不同畫面
  switch (quiz_gameState) {
    case 'START':
      drawStartScreenQuiz();
      break;
    case 'QUESTION':
      drawQuestionScreenQuiz();
      break;
    case 'FEEDBACK':
      drawFeedbackScreenQuiz();
      break;
    case 'RESULT':
      drawResultScreenQuiz();
      break;
  }

  // 更新並繪製煙火（若有）
  updateFireworksQuiz();
  drawFireworksQuiz();
}

// 這是從 Sketch 2 的 mousePressed() 移過來的
function mousePressedQuiz() {
  // 重設游標
  cursor(ARROW);

  if (quiz_gameState === 'START') {
    if (isMouseOverQuiz(quiz_startButton)) {
      quiz_gameState = 'QUESTION';
    }
  } else if (quiz_gameState === 'QUESTION') {
    for (let btn of quiz_answerButtons) {
      if (isMouseOverQuiz(btn)) {
        checkAnswerQuiz(btn.option);
        break; // 點擊後就停止檢查
      }
    }
  } else if (quiz_gameState === 'RESULT') {
    if (isMouseOverQuiz(quiz_restartButton)) {
      startGameQuiz();
    }
  }
}


// --- 以下是 Sketch 2 的所有輔助函數，全部加上 quiz_ 前綴 ---

// 1. 處理CSV資料
function processDataQuiz() {
  quiz_allQuestions = []; // 重設
  for (let row of quiz_questionTable.getRows()) {
    quiz_allQuestions.push({
      question: row.getString('question'), // 使用 'header' 名稱來讀取
      opA: row.getString('opA'),
      opB: row.getString('opB'),
      opC: row.getString('opC'),
      opD: row.getString('opD'),
      correct: row.getString('correct').trim().toUpperCase() // 'A','B','C','D'
    });
  }
}

// 2. 設定按鈕位置
function setupButtonsQuiz() {
  // 【關鍵】這裡的 width 和 height 會是 800x600 (因為我們在切換模式時 resizeCanvas 了)
  // 開始按鈕
  quiz_startButton = { x: width / 2 - 100, y: height / 2 + 50, w: 200, h: 60, text: '開始測驗' };
  // 重新開始按鈕
  quiz_restartButton = { x: width / 2 - 100, y: height / 2 + 150, w: 200, h: 60, text: '重新開始' };

  // 四個答案按鈕 (固定位置)
  quiz_answerButtons = [];
  let btnW = 350;
  let btnH = 80;
  let gap = 20;
  quiz_answerButtons.push({ x: 40, y: 250, w: btnW, h: btnH, option: 'A', text: '' });
  quiz_answerButtons.push({ x: 40 + btnW + gap, y: 250, w: btnW, h: btnH, option: 'B', text: '' });
  quiz_answerButtons.push({ x: 40, y: 250 + btnH + gap, w: btnW, h: btnH, option: 'C', text: '' });
  quiz_answerButtons.push({ x: 40 + btnW + gap, y: 250 + btnH + gap, w: btnW, h: btnH, option: 'D', text: '' });
}

// 3. 開始或重新開始遊戲
function startGameQuiz() {
  quiz_score = 0;
  quiz_currentQuestionIndex = 0;
  quiz_fireworks = [];
  quiz_fireworksTimer = 0;
  
  // 確保有題目資料
  if (quiz_allQuestions && quiz_allQuestions.length > 0) {
    let take = min(5, quiz_allQuestions.length);
    quiz_quizQuestions = shuffle(quiz_allQuestions).slice(0, take);
    quiz_gameState = 'START';
  } else {
    console.error('沒有題目資料');
  }
}

// 4. 檢查答案
function checkAnswerQuiz(selectedOption) {
  let correctOption = quiz_quizQuestions[quiz_currentQuestionIndex].correct;

  if (selectedOption === correctOption) {
    quiz_score++;
    quiz_feedbackMessage = '答對了！';
    quiz_feedbackColor = color(0, 255, 0); // 更明顯的綠色
    // 產生煙火
    for (let i = 0; i < 3; i++) {
      spawnFireworkQuiz(random(100, width - 100), random(150, height - 150));
    }
  } else {
    quiz_feedbackMessage = `答錯了... 正確答案是 ${correctOption}`;
    quiz_feedbackColor = color(255, 0, 0); // 紅色
  }
  
  quiz_gameState = 'FEEDBACK';
  quiz_feedbackTimer = 90; // 顯示回饋 1.5 秒 (60fps * 1.5)
}

// 5. 進入下一題
function nextQuestionQuiz() {
  quiz_currentQuestionIndex++;
  if (quiz_currentQuestionIndex >= quiz_quizQuestions.length) {
    quiz_gameState = 'RESULT';
    // 在進入結果畫面時產生對應數量的煙火
    spawnResultFireworksQuiz();
  } else {
    quiz_gameState = 'QUESTION';
  }
}

// 新增：根據分數在結果頁面生成煙火
function spawnResultFireworksQuiz() {
  let total = quiz_quizQuestions.length;
  
  if (quiz_score === total && total > 0) {
    let cnt = 12; // 滿分，放 12 個
    for (let i = 0; i < cnt; i++) {
      spawnFireworkQuiz(random(100, width - 100), random(80, height / 2));
    }
  }
}

// 6. 結果字串 (未被使用)
function getResultTextQuiz() {
  // ... (此函數未被呼叫)
}

// --- 測驗畫面繪製函數 ---

function drawStartScreenQuiz() {
  textAlign(CENTER, CENTER);
  fill(30, 60, 90);
  textSize(48);
  text('p5.js 題庫測驗', width / 2, height / 2 - 100);
  textSize(24);
  text(`從 ${quiz_allQuestions.length} 題中隨機抽取 ${min(5, quiz_allQuestions.length)} 題`, width / 2, height / 2 - 30);
  
  // 繪製開始按鈕
  drawButtonQuiz(quiz_startButton);
}

function drawQuestionScreenQuiz() {
  if (quiz_quizQuestions.length === 0) return; // 防止資料還沒載入
  
  let q = quiz_quizQuestions[quiz_currentQuestionIndex];
  
  // 繪製問題
  textAlign(LEFT, TOP);
  fill(20);
  textSize(20);
  text(`第 ${quiz_currentQuestionIndex + 1} 題 / ${quiz_quizQuestions.length} 題`, 40, 40);
  // 
  // == 這裡就是修正的地方 (已刪除 'TA') ==
  // 
  textSize(28);
  text(q.question, 40, 80, width - 80, 150); // 自動換行
  
  // 更新並繪製答案按鈕
  quiz_answerButtons[0].text = 'A. ' + q.opA;
  quiz_answerButtons[1].text = 'B. ' + q.opB;
  quiz_answerButtons[2].text = 'C. ' + q.opC;
  quiz_answerButtons[3].text = 'D. ' + q.opD;
  
  for (let btn of quiz_answerButtons) {
    drawButtonQuiz(btn);
  }
}

function drawFeedbackScreenQuiz() {
  // 半透明覆蓋
  push();
  noStroke();
  fill(red(quiz_feedbackColor), green(quiz_feedbackColor), blue(quiz_feedbackColor), 140);
  rect(0, 0, width, height);
  pop();

  // 顯示回饋文字
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(48);
  text(quiz_feedbackMessage, width / 2, height / 2);

  // 
  // == 這裡就是修正的地方 (已刪除 's') ==
  // 
  // 計時
  quiz_feedbackTimer--;
  if (quiz_feedbackTimer <= 0) {
    nextQuestionQuiz();
  }
}

function drawResultScreenQuiz() {
  // 黃色背景
  background(255, 255, 150);
  
  let total = quiz_quizQuestions.length;

  // 新規則：根據分數決定背景效果 (煙火 或 重複文字)
  if (quiz_score === total && total > 0) { // 確保有題目且全對
    // 滿分 (5/5)：持續產生煙火
    if (frameCount % 20 === 0) { // 每20幀產生新煙火
      for (let i = 0; i < 3; i++) {
        spawnFireworkQuiz(random(width), random(height / 2));
      }
    }
  } else {
    // 
    // == 這裡就是修正的地方 (已刪除 'TA') ==
    // 
    // 非滿分 (0-4)：背景充滿「請繼續加油」
    push();
    fill(0, 40); // 設定一個半透明的深色 (才不會太搶戲)
    noStroke();
    textSize(12); // 你指定的字體大小
    textAlign(LEFT, TOP);
    
    let txt = "請繼續加油 "; // 要重複的文字
    let spacing = 5; // 你指定的間隔
    let txtW = textWidth(txt); // 測量一次文字寬度
    let txtH = 12; // 文字高度 (即字體大小)
    
    // 使用巢狀迴圈鋪滿畫面
    for (let y = 0; y < height; y += (txtH + spacing)) {
      for (let x = 0; x < width; x += (txtW + spacing)) {
        text(txt, x, y);
      }
    }
    pop();
  }

  // 繪製標題和分數 (這部分不變)
  textAlign(CENTER, CENTER);
  fill(20);
  
  textSize(50);
  text('測驗結束！', width / 2, 120);
  
  textSize(36);
  text(`你的成績: ${quiz_score} / ${total}`, width / 2, 200);
  
  // 新規則：根據分數顯示對應的鼓勵/吐槽文字
  textSize(28);
  fill(80, 30, 200); // 結果文字使用紫色
  
  let resultMsg = '';
  if (total === 5) {
    if (quiz_score === 0) {
      // 
      // == 這裡就是修正的地方 (已刪除 'TA') ==
      // 
      resultMsg = "你太爛了請讀書";
    } else if (quiz_score === 1) {
      resultMsg = "你其實蠻爛的需要檢討";
    } else if (quiz_score === 2) {
      resultMsg = "有讀書但讀的不多 快去複習";
    } else if (quiz_score === 3) {
      resultMsg = "已經答對一半的題目了 繼續加油";
    } else if (quiz_score === 4) {
      resultMsg = "加油 差一題就全對了";
    } else if (quiz_score === 5) {
      resultMsg = "你超強";
    }
  } else {
    // 備用邏輯
    if (quiz_score === total && total > 0) {
      // 
      // == 這裡就是修正的地方 (已刪除 's') ==
      // 
      resultMsg = "你超強 (全對)";
    } else if (quiz_score === 0) {
      resultMsg = "你太爛了請讀書";
    } else {
      resultMsg = "繼續加油";
    }
  }
  
  text(resultMsg, width / 2, 260);

  // 繪製重新開始按鈕 (不變)
  // 
  // == 這裡就是修正的地方 (已刪除 'A') ==
  // 
  drawButtonQuiz(quiz_restartButton);
}


// --- 測驗互動與輔助函數 ---

// 繪製按鈕 (含 hover 效果)
function drawButtonQuiz(btn) {
  let isHover = isMouseOverQuiz(btn);
  
  push(); // 保存繪圖狀態
  if (isHover) {
    fill(100, 180, 255); // hover 亮藍色
    stroke(255);
    strokeWeight(2);
    cursor(HAND); // 改變滑鼠游標
  } else {
    // 
    // == 這裡就是修正的地方 (已刪除 'TA') ==
    // 
    fill(50, 100, 200, 200); // 預設藍色
    noStroke();
  }
  rect(btn.x, btn.y, btn.w, btn.h, 10); // 圓角矩形
  
  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2); // 按鈕文字置中
  pop(); // 恢復繪圖狀態
}

// 檢查滑鼠是否在按鈕上
function isMouseOverQuiz(btn) {
  // 檢查 btn 是否存在 (避免切換模式時的瞬間錯誤)
  if (!btn) return false;
  return (mouseX > btn.x && mouseX < btn.x + btn.w &&
          // 
          // == 這裡就是修正的地方 (已刪除 's') ==
          // 
          mouseY > btn.y && mouseY < btn.y + btn.h);
}

// --- 測驗背景粒子 (裝飾) ---

function setupBgParticlesQuiz() {
  quiz_bgParticles = [];
  for (let i = 0; i < 60; i++) {
    quiz_bgParticles.push({
      x: random(width),
      y: random(height),
      vx: random(-0.3, 0.3),
      vy: random(-0.2, 0.2),
      r: random(2, 6),
      alpha: random(50, 120)
    });
  }
}

function drawBgParticlesQuiz() {
  for (let p of quiz_bgParticles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
    noStroke();
    fill(255, p.alpha);
    ellipse(p.x, p.y, p.r);
  }
}

// --- 測驗煙火系統 ---

function spawnFireworkQuiz(x, y) {
  let colors = [
    [255, 200, 0],    // 金黃色
    [255, 100, 0],    // 橙色
    [255, 50, 50],    // 紅色
    [255, 255, 100],  // 亮黃色
    // 
    // == 這裡就是修正的地方 (已刪除 'Two') ==
    // 
    [255, 150, 0]     // 深橙色
  ];
  let col = random(colors);
  // 增加碎片數量
  for (let i = 0; i < 100; i++) {
    let angle = random(TWO_PI);
    let speed = random(2, 8);
    quiz_fireworks.push({
      x: x,
      y: y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      life: random(60, 120),
      age: 0,
      r: random(2, 5),
      col: col.slice()
    });
  }
  quiz_fireworksTimer = 120; // 最多顯示時間
}

function updateFireworksQuiz() {
  // 
  // == 這裡就是修正的地方 (已刪除 'Date') ==
  // 
  for (let i = quiz_fireworks.length - 1; i >= 0; i--) {
    let f = quiz_fireworks[i];
    f.x += f.vx;
    f.y += f.vy;
    // 模擬重力與空氣阻力
    f.vy += 0.06;
    // 
    // == 這裡就是修正的地方 (已刪除 'A') ==
    // 
    f.vx *= 0.995;
    f.vy *= 0.995;
    f.age++;
    if (f.age > f.life) {
      quiz_fireworks.splice(i, 1);
    }
  }
  if (quiz_fireworksTimer > 0) quiz_fireworksTimer--;
}

function drawFireworksQuiz() {
  noStroke();
  for (let f of quiz_fireworks) {
    let alpha = map(f.age, 0, f.life, 255, 0);
    fill(f.col[0], f.col[1], f.col[2], alpha);
    ellipse(f.x, f.y, f.r * 2);
  }
}

// ===================================
// == 6. 新增的選單點擊輔助函數 ==
// ===================================

/**
 * 檢查滑鼠點擊位置是否在某個選單項目上
 * @returns {object} { clicked: boolean, index: number }
 */
function checkMenuItemClick() {
for (let i = 0; i < menuItems.length; i++) {
  let btnY = 24 + i * (menuH + 12);
  // 檢查 Y 軸、X 軸
  if (mouseY > btnY && mouseY < btnY + menuH && mouseX > 0 && mouseX < menuW) {
    return { clicked: true, index: i };
  }
}
return { clicked: false, index: -1 };
}

/**
 * 處理選單項目的點擊動作
 * @param {number} btnIndex - 被點擊的按鈕索引
 */
function handleMenuItemClick(btnIndex) {
// (這段邏輯是從你舊的 mousePressed 移過來的)
switch (btnIndex) {
  case 0: // 爆破氣球
    if (menuLinks[0]) window.open(menuLinks[0], "_blank");
    startBalloons(); // 啟動氣球動畫
    break;
  case 1: // 氣球講義
    if (menuLinks[1]) window.open(menuLinks[1], "_blank");
    break;
  case 2: // 回到主頁
    mode = 'main';
    // 【關鍵】將畫布調回全螢幕
    resizeCanvas(windowWidth, windowHeight);
    // 
    // == 這裡就是修正的地方 (已刪除 'T') ==
S   // 
    windowResized(); // 重新產生主頁紋理
    break;
  // 
  // == 這裡就是修正的地方 (已刪除 'What') ==
  // 
  case 3: // 測驗卷
    mode = 'quiz';
    // 【關鍵】將畫布切換為 800x600
    resizeCanvas(800, 600);
    // 【關鍵】重新初始化測驗 (為了讓按鈕位置適應 800x600)
    initializeQuiz();
    break;
  case 4: // 測驗筆記
    if (menuLinks[4]) window.open(menuLinks[4], "_blank");
    break;
  case 5: // 教科系
    // 
    // == 這裡就是修正的地方 (已刪除 'I') ==
    // 
    if (menuLinks[5]) window.open(menuLinks[5], "_blank");
    break;
}
}