const app = document.querySelector('#app');
const TOTAL_QUESTIONS = 10;

const state = {
  question: 1,
  score: 0,
  left: 0,
  right: 0,
  selected: '',
  answered: false,
  hintOpen: false,
  previousPair: ''
};

function randomTwoDigitNumber() {
  return Math.floor(Math.random() * 90) + 10;
}

function makeQuestion() {
  let left;
  let right;
  let pair;
  const shouldMatch = state.question === 4 || state.question === 8;

  do {
    left = randomTwoDigitNumber();
    right = shouldMatch ? left : randomTwoDigitNumber();
    pair = `${left}-${right}`;
  } while (pair === state.previousPair || (!shouldMatch && left === right));

  Object.assign(state, {
    left,
    right,
    selected: '',
    answered: false,
    hintOpen: false,
    previousPair: pair
  });
}

function hasFinalConsonant(number) {
  return [0, 1, 3, 6, 7, 8].includes(number % 10);
}

function withTopic(number) {
  return `${number}${hasFinalConsonant(number) ? '은' : '는'}`;
}

function withAnd(number) {
  return `${number}${hasFinalConsonant(number) ? '과' : '와'}`;
}

function progressMarkup() {
  return `<div class="progress-row" aria-label="10문제 중 ${state.question}번째 문제">
    ${Array.from({ length: TOTAL_QUESTIONS }, (_, index) => `<span class="${index + 1 < state.question ? 'done' : ''} ${index + 1 === state.question ? 'current' : ''}"></span>`).join('')}
  </div>`;
}

function blocksMarkup(number) {
  const tens = Math.floor(number / 10);
  const ones = number % 10;
  return `<div class="block-side">
    <h3>${number}</h3>
    <div class="blocks" aria-label="십의 묶음 ${tens}개와 낱개 ${ones}개">
      <div class="tens">${'<span class="ten"></span>'.repeat(tens)}</div>
      <div class="ones">${'<span class="one"></span>'.repeat(ones)}</div>
    </div>
    <p class="place-note">십의 자리 <strong>${tens}</strong> · 일의 자리 <strong>${ones}</strong></p>
  </div>`;
}

function renderQuestion() {
  app.innerHTML = `<section class="practice-card">
    ${progressMarkup()}
    <p class="question-label"><strong>문제 ${state.question}</strong> · 두 수 사이에 알맞은 기호를 골라 보세요.</p>
    <div class="number-stage" aria-label="${state.left}과 ${state.right}의 크기 비교">
      <div class="number-card">${state.left}</div>
      <div class="symbol-slot" id="symbol-slot" aria-live="polite">?</div>
      <div class="number-card">${state.right}</div>
    </div>
    <h2 class="compare-title">어느 기호가 알맞을까요?</h2>
    <div class="symbol-choices">
      <button class="symbol-button" data-symbol="&lt;" aria-label="왼쪽 수가 더 작습니다">&lt;</button>
      <button class="symbol-button" data-symbol="=" aria-label="두 수가 같습니다">=</button>
      <button class="symbol-button" data-symbol="&gt;" aria-label="왼쪽 수가 더 큽니다">&gt;</button>
    </div>
    <div class="actions">
      <button class="action-button hint-button" id="hint-button">🧱 십의 묶음 힌트</button>
      <button class="action-button check-button" id="check-button" disabled>정답 확인</button>
    </div>
    <section class="hint-panel" id="hint-panel" ${state.hintOpen ? '' : 'hidden'} aria-label="십의 묶음 힌트">
      <p class="hint-heading">먼저 <strong>십의 자리</strong>를 비교하고, 같으면 <strong>일의 자리</strong>를 비교해요.</p>
      <div class="block-comparison">${blocksMarkup(state.left)}${blocksMarkup(state.right)}</div>
    </section>
    <div class="feedback" id="feedback" aria-live="polite"></div>
  </section>`;

  document.querySelectorAll('.symbol-button').forEach((button) => {
    button.addEventListener('click', () => selectSymbol(button.dataset.symbol));
  });
  document.querySelector('#hint-button').addEventListener('click', toggleHint);
  document.querySelector('#check-button').addEventListener('click', checkAnswer);
}

function selectSymbol(symbol) {
  if (state.answered) return;
  state.selected = symbol;
  document.querySelectorAll('.symbol-button').forEach((button) => {
    button.classList.toggle('selected', button.dataset.symbol === symbol);
  });
  const slot = document.querySelector('#symbol-slot');
  slot.textContent = symbol;
  slot.classList.add('selected');
  document.querySelector('#check-button').disabled = false;
}

function toggleHint() {
  state.hintOpen = !state.hintOpen;
  const panel = document.querySelector('#hint-panel');
  panel.hidden = !state.hintOpen;
  document.querySelector('#hint-button').textContent = state.hintOpen ? '🧱 힌트 닫기' : '🧱 십의 묶음 힌트';
  if (state.hintOpen) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function checkAnswer() {
  const correctSymbol = state.left === state.right ? '=' : state.left > state.right ? '>' : '<';
  const feedback = document.querySelector('#feedback');

  if (state.selected !== correctSymbol) {
    feedback.innerHTML = `<div class="feedback-box wrong">한 번 더 생각해 볼까요? 십의 자리부터 천천히 비교해 보세요.</div>`;
    if (!state.hintOpen) toggleHint();
    return;
  }

  state.answered = true;
  state.score += 1;
  document.querySelectorAll('.symbol-button').forEach((button) => { button.disabled = true; });
  document.querySelector('#check-button').remove();

  const larger = Math.max(state.left, state.right);
  const smaller = Math.min(state.left, state.right);
  const answerSentence = state.left === state.right
    ? `${withAnd(state.left)} ${state.right}의 크기는 같습니다.`
    : `${withTopic(smaller)} ${larger}보다 작고, ${withTopic(larger)} ${smaller}보다 큽니다.`;
  feedback.innerHTML = `<div class="feedback-box correct">🌟 잘 비교했어요!
    <strong class="answer-sentence">${answerSentence}</strong>
  </div>
  <button class="action-button next-button" id="next-button">${state.question === TOTAL_QUESTIONS ? '결과 보기' : '다음 문제'} →</button>`;
  document.querySelector('#next-button').addEventListener('click', nextQuestion);
}

function nextQuestion() {
  if (state.question === TOTAL_QUESTIONS) {
    renderResult();
    return;
  }
  state.question += 1;
  makeQuestion();
  renderQuestion();
  focusApp();
}

function renderResult() {
  const message = state.score === TOTAL_QUESTIONS ? '두 자리 수의 크기를 아주 잘 비교했어요!' : '십의 자리부터 살펴보는 방법을 잘 익혔어요!';
  app.innerHTML = `<section class="result-card">
    <div class="medal" aria-hidden="true">🏅</div>
    <h1>크기 비교 연습 완료!</h1>
    <p>${message}</p>
    <div class="score">${state.score} / ${TOTAL_QUESTIONS}</div>
    <button class="action-button next-button" id="restart-button">↻ 새로운 문제 풀기</button>
  </section>`;
  document.querySelector('#restart-button').addEventListener('click', restart);
  focusApp();
}

function focusApp() {
  app.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function restart(event) {
  event?.preventDefault();
  Object.assign(state, { question: 1, score: 0, previousPair: '' });
  makeQuestion();
  renderQuestion();
  focusApp();
}

document.querySelector('.brand').addEventListener('click', restart);
restart();

