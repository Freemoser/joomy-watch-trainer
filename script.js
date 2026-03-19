let vocab = null;
let currentHr = 0;
let currentMin = 0;
let currentSolutionStr = "";

// DOM Elements
const startScreen = document.getElementById("start-screen");
const trainingScreen = document.getElementById("training-screen");
const feedbackSection = document.getElementById("feedback-section");
const analogClock = document.getElementById("analog-clock");
const hourHand = document.getElementById("hour-hand");
const minuteHand = document.getElementById("minute-hand");
const clock24h = document.getElementById("clock-24h");
const clock12h = document.getElementById("clock-12h");
const thaiInput = document.getElementById("thai-input");
const btnShowSolution = document.getElementById("btn-show-solution");
const solutionSection = document.getElementById("solution-section");
const solutionText = document.getElementById("solution-text");
const btnStart = document.getElementById("btn-start");
const btnNext = document.getElementById("btn-next");
const btnCorrect = document.getElementById("btn-correct");
const feedbackMessage = document.getElementById("feedback-message");
const digitalClocksContainer = document.querySelector(".digital-clocks");
const inputSectionContainer = document.querySelector(".input-section");
const roundsInput = document.getElementById("rounds-input");
const modeSelect = document.getElementById("mode-select");
const endScreen = document.getElementById("end-screen");
const btnRestart = document.getElementById("btn-restart");
const contextPrompt = document.getElementById("context-prompt");
const finalScoreMessage = document.getElementById("final-score-message");

let currentHourDeg = 0;
let currentMinDeg = 0;
let totalRounds = 10;
let currentRound = 0;
let currentScore = 0;
let trainingMode = "time";

// Draw clock numbers
function drawClockNumbers() {
    for (let i = 1; i <= 12; i++) {
        const num = document.createElement("div");
        num.className = "clock-number";
        num.style.transform = `rotate(${i * 30}deg)`;
        num.innerHTML = `<span style="transform: rotate(-${i * 30}deg)">${i}</span>`;
        analogClock.appendChild(num);
    }
}

// Load vocabulary
async function init() {
    try {
        const response = await fetch("vocabulary.json");
        vocab = await response.json();
    } catch (e) {
        console.error("Error loading vocabulary:", e);
        vocab = {}; 
    }
}

// Event Listeners
btnStart.addEventListener("click", () => {
    totalRounds = parseInt(roundsInput.value) || 10;
    trainingMode = modeSelect.value;
    currentRound = 0;
    currentScore = 0;
    startScreen.classList.add("hidden");
    trainingScreen.classList.remove("hidden");
    void trainingScreen.offsetWidth; // Force reflow so transition works
    nextRound();
});

btnNext.addEventListener("click", () => {
    feedbackSection.classList.add("hidden");
    if (currentRound >= totalRounds) {
        showEndScreen();
    } else {
        trainingScreen.classList.remove("hidden");
        void trainingScreen.offsetWidth; // Force reflow
        nextRound();
    }
});

btnShowSolution.addEventListener("click", () => {
    solutionText.textContent = currentSolutionStr;
    solutionSection.classList.remove("hidden");
    btnShowSolution.classList.add("hidden");
});

btnRestart.addEventListener("click", () => {
    endScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
});

function showEndScreen() {
    endScreen.classList.remove("hidden");
    finalScoreMessage.textContent = `You completed ${totalRounds} rounds and got ${currentScore} correct!`;
}

function nextRound() {
    currentRound++;
    
    // Hide inputs/digital while spinning
    digitalClocksContainer.style.opacity = "0";
    inputSectionContainer.style.opacity = "0";
    contextPrompt.style.opacity = "0";
    btnShowSolution.style.opacity = "0";
    btnShowSolution.style.pointerEvents = "none";
    
    // Reset UI
    thaiInput.value = "";
    solutionSection.classList.add("hidden");
    btnShowSolution.classList.remove("hidden");

    // Generate random time
    currentHr = Math.floor(Math.random() * 24);
    currentMin = Math.floor(Math.random() * 60);

    // Trigger spin animation
    updateAnalogClock(currentHr, currentMin);

    // Wait for the animation to finish before showing interactions
    setTimeout(() => {
        updateDigitalClocks(currentHr, currentMin);
        
        // Reveal elements
        digitalClocksContainer.style.opacity = "1";
        inputSectionContainer.style.opacity = "1";
        if (trainingMode === "sentences") contextPrompt.style.opacity = "1";
        btnShowSolution.style.opacity = "1";
        btnShowSolution.style.pointerEvents = "auto";

        // Calculate solution
        if (vocab && vocab.numbers) {
            let timeSolution = generateThaiTime(currentHr, currentMin, vocab);
            if (trainingMode === "sentences" && vocab.sentences) {
                const keys = Object.keys(vocab.sentences);
                const key = keys[Math.floor(Math.random() * keys.length)];
                const template = vocab.sentences[key];
                
                contextPrompt.textContent = `Translate: ${template.en.replace("{time}", clock24h.textContent)}`;
                contextPrompt.classList.remove("hidden");
                
                currentSolutionStr = template.th_rom.replace("{time}", timeSolution);
            } else {
                contextPrompt.classList.add("hidden");
                currentSolutionStr = timeSolution;
            }
        } else {
            currentSolutionStr = "Error loading data";
        }
    }, 1500); // Wait 1.5s for the CSS transition
}

function updateDigitalClocks(hr, min) {
    const hrStr = hr.toString().padStart(2, '0');
    const minStr = min.toString().padStart(2, '0');
    clock24h.textContent = `${hrStr}:${minStr}`;

    const ampm = hr >= 12 ? 'PM' : 'AM';
    let hr12 = hr % 12;
    hr12 = hr12 ? hr12 : 12; // 0 becomes 12
    clock12h.textContent = `${hr12.toString().padStart(2, '0')}:${minStr} ${ampm}`;
}

function updateAnalogClock(hr, min) {
    const minDegTarget = min * 6; // 360 / 60
    const hrDegTarget = (hr % 12) * 30 + (min / 60) * 30; // 360 / 12 = 30
    
    // Calculate shortest distance forward, plus extra spins
    const currentMinMod = currentMinDeg % 360;
    let minDiff = minDegTarget - currentMinMod;
    if (minDiff < 0) minDiff += 360;
    const minSpinDistance = minDiff + (360 * 3); // 3 extra full spins
    currentMinDeg += minSpinDistance;
    
    const currentHrMod = currentHourDeg % 360;
    let hrDiff = hrDegTarget - currentHrMod;
    if (hrDiff < 0) hrDiff += 360;
    const hrSpinDistance = hrDiff + (360 * 2); // 2 extra full spins
    currentHourDeg += hrSpinDistance;
    
    hourHand.style.transform = `translateX(-50%) rotate(${currentHourDeg}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${currentMinDeg}deg)`;
}

function showFeedback(isCorrect) {
    if (isCorrect) currentScore++;
    trainingScreen.classList.add("hidden");
    feedbackSection.classList.remove("hidden");
    if (isCorrect) {
        feedbackTitle.textContent = "Keng mak! (Excellent!)";
        feedbackTitle.style.color = "var(--success-color)";
        feedbackMessage.textContent = "You got it right!";
    } else {
        feedbackTitle.textContent = "So close!";
        feedbackTitle.style.color = "var(--danger-color)";
        feedbackMessage.textContent = `The correct answer was: ${currentSolutionStr}`;
    }
}

btnCorrect.addEventListener("click", () => {
    showFeedback(true);
});

btnWrong.addEventListener("click", () => {
    showFeedback(false);
});

function getNumStr(num, v) {
    if (v.numbers[num]) return v.numbers[num].th_rom;
    if (num < 10) return v.numbers[num].th_rom;
    if (num > 10 && num < 20) {
        if (num === 11) return v.numbers["11"].th_rom;
        return v.numbers["10"].th_rom + " " + v.numbers[num % 10].th_rom;
    }
    const tens = Math.floor(num / 10) * 10;
    const units = num % 10;
    let tenStr = v.numbers[tens] ? v.numbers[tens].th_rom : (v.numbers[Math.floor(num/10)].th_rom + " " + v.numbers["10"].th_rom);
    if (units === 0) return tenStr;
    let unitStr = (units === 1) ? v.timeWords.et.th_rom : v.numbers[units].th_rom;
    return tenStr + " " + unitStr;
}

function generateThaiTime(hr, min, v) {
    let hourStr = "";
    if (hr === 0) {
        hourStr = v.timeWords.thiang_kheun.th_rom;
    } else if (hr >= 1 && hr <= 5) {
        hourStr = v.timeWords.dtii.th_rom + " " + v.numbers[hr].th_rom;
    } else if (hr >= 6 && hr <= 11) {
        hourStr = v.numbers[hr].th_rom + " " + v.timeWords.mong_chao.th_rom;
    } else if (hr === 12) {
        hourStr = v.timeWords.thiang.th_rom;
    } else if (hr === 13) {
        hourStr = v.timeWords.baai_mong.th_rom; 
    } else if (hr >= 14 && hr <= 15) {
        hourStr = v.timeWords.baai.th_rom + " " + v.numbers[hr - 12].th_rom + " " + v.timeWords.mong.th_rom;
    } else if (hr >= 16 && hr <= 18) {
        hourStr = v.numbers[hr - 12].th_rom + " " + v.timeWords.mong_yen.th_rom;
    } else if (hr >= 19 && hr <= 23) {
        hourStr = v.numbers[hr - 18].th_rom + " " + v.timeWords.thum.th_rom;
    }

    let minStr = "";
    if (min === 0) {
        // exactly on the hour
    } else if (min === 30) {
        minStr = " " + v.timeWords.half.th_rom;
    } else {
        let nStr = getNumStr(min, v);
        minStr = " " + nStr + " " + v.timeWords.minute.th_rom;
    }

    return hourStr + minStr;
}

// Start
drawClockNumbers();
init();
