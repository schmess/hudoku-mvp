// Puzzle templates
const template4x5 = [
    ['a', 'a', 'a', 'b', 'b'],
    ['a', 'a', 'a', 'b', 'b'],
    ['a', 'a', 'a', 'd', 'd'],
    ['-a', '-a', '-a', 'd', 'd']
];

const template6x5 = [
    ['a', 'a', 'a', 'b', 'b'],
    ['a', 'a', 'a', 'b', 'b'],
    ['a', 'a', 'a', '-a', '-a'],
    ['c', 'c', 'c', '-c', '-c'],
    ['c', 'c', 'c', 'd', 'd'],
    ['c', 'c', 'c', 'd', 'd']
];

let currentPuzzles = {};
let revealedNumbers = {}; // Track which numbers are revealed
let showingSolutions = false;
let selectedCell = null; // Track currently selected cell for input
let currentPuzzleType = null; // Track which puzzle is currently being shown

// Timer and scoring system
let gameTimer = 30; // Current timer value in seconds
let gameStartTime = null; // When the game started
let timerInterval = null; // Timer interval reference
let timerPaused = false; // Track if timer is paused
let timerWasPaused = false;
let gameStats = {
    incorrectEntries: 0, // Number of wrong answers
    totalTime: 0,        // Total game time in seconds
    resolvedCells: 0     // Number of cells resolved
};

const HINTS_PER_REGION = {
    a: 5, // 3x3 region
    b: 2, // 2x2 region
    c: 4, // 3x3 region
    d: 1  // 2x2 region
};

// Track the last hovered or clicked cell for hint targeting
let lastActiveCell = null;

// Add this at the top of your script section
let showOnlyPossibleNumbers = false;

function isEmptyCell(templateCell) {
    return templateCell?.[0] === '-';
}

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function isValidPlacement(grid, row, col, num, template) {
    // Check row constraint
    for (let c = 0; c < grid[row].length; c++) {
        if (c !== col && grid[row][c] === num) return false;
    }
    
    // Check column constraint
    for (let r = 0; r < grid.length; r++) {
        if (r !== row && grid[r][col] === num) return false;
    }
    
    // Check region constraint
    const region = template[row][col];
    if (isEmptyCell(region)) return true;
    
    for (let r = 0; r < template.length; r++) {
        for (let c = 0; c < template[r].length; c++) {
            if (template[r][c] === region && !(r === row && c === col)) {
                if (grid[r][c] === num) return false;
            }
        }
    }
    
    return true;
}

function getValidNumbers(region) {
    switch (region) {
        case 'a':
        case 'c':
            return [1, 2, 3, 4, 5, 6, 7, 8, 9];
        case 'b':
        case 'd':
            return [1, 2, 3, 4];
        default:
            return [];
    }
}

function getNumbersInRegion(grid, template, mask) {
    const unviableClues = new Set();
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (template[r][c] === mask && typeof grid[r][c] === 'number' && grid[r][c] > 0) {
                unviableClues.add(grid[r][c]);
            }
        }
    }
    return Array.from(unviableClues);
}

function getNumbersInRowCol(grid, template, r, c) {
    const unviableClues = new Set();
    // Check row
    for (let col = 0; col < grid[r].length; col++) {
        if (/*template[r][col] === mask &&*/ typeof grid[r][col] === 'number' && grid[r][col] > 0) {
            unviableClues.add(grid[r][col]);
        }
    }
    // Check column
    for (let row = 0; row < grid.length; row++) {
        if (/*template[row][c] === mask &&*/ typeof grid[row][c] === 'number' && grid[row][c] > 0) {
            unviableClues.add(grid[row][c]);
        }
    }
    return Array.from(unviableClues);
}

function solvePuzzle(template, given = null) {
    const grid = given ? given.map(row => row.slice())
        : template.map(row => row.map(cell => isEmptyCell(cell) ? '-' : 0));
    function backtrack() {
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c] === 0) {
                    const region = template[r][c];
                    const validNums = getValidNumbers(region);
                    for (const n of validNums) {
                        if (isValidPlacement(grid, r, c, n, template)) {
                            grid[r][c] = n;
                            if (backtrack()) return true;
                            grid[r][c] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }
    if (backtrack()) {
        return grid;
    }
    return null;
}

function createPuzzle(template) {
    const solution = solvePuzzle(template);
    if (!solution) return null;
    // Create revealed grid - initially all zeros (hidden)
    const revealed = template.map(row => row.map(cell => isEmptyCell(cell) ? '-' : 0));
    // Get cells for each region
    const regionCells = {};
    for (let r = 0; r < template.length; r++) {
        for (let c = 0; c < template[r].length; c++) {
            const region = template[r][c];
            if (!isEmptyCell(region)) {
                if (!regionCells[region]) regionCells[region] = [];
                regionCells[region].push([r, c]);
            }
        }
    }
    let totalRevealed = 0;
    // Reveal numbers per region based on size:
    // Regions A & C (3x3, numbers 1-9): reveal 4 numbers each
    // Regions B & D (2x2, numbers 1-4): reveal 2 numbers each
    Object.keys(regionCells).forEach(region => {
        const cells = regionCells[region];
        const numbersToReveal = HINTS_PER_REGION[region] || 1;
        // Randomly select cells to reveal in this region
        const shuffledCells = shuffle(cells);
        for (let i = 0; i < Math.min(numbersToReveal, cells.length); i++) {
            const [r, c] = shuffledCells[i];
            revealed[r][c] = solution[r][c];
            totalRevealed++;
        }
    });
    // Count total fillable cells
    const totalCells = Object.values(regionCells).flat().length;
    // --- Generate empty cell hints (for '-a', '-c', etc.) ---
    const emptyHints = {};
    const unusedEmptyCellClues = {};
    for (let r = 0; r < template.length; r++) {
        for (let c = 0; c < template[r].length; c++) {
            const region = template[r][c];
            if (isEmptyCell(region)) {
                const mask = region[1]; // e.g., for '-a', mask is 'a'
                if (!unusedEmptyCellClues[mask]) unusedEmptyCellClues[mask] = new Set();
                let shown = false;
                // Use the same logic as before, but only once
                const revealedSet = getNumbersInRegion(revealed, template, mask);
                const unvialbleSet = getNumbersInRowCol(solution, template, r, c);
                for (let num = 9; num >= 1; num--) {
                    if (
                        !revealedSet.includes(num) &&
                        !unvialbleSet.includes(num) &&
                        !unusedEmptyCellClues[mask].has(num)
                    ) {
                        emptyHints[`${r},${c}`] = num;
                        unusedEmptyCellClues[mask].add(num);
                        shown = true;
                        break;
                    }
                }
                if (!shown) {
                    emptyHints[`${r},${c}`] = '-';
                }
            }
        }
    }
    const initialClues = revealed.flat().filter(cell => cell !== 0 && cell !== '-').length;
    return {
        solution,
        revealed,
        totalCells,
        initialClues,
        revealedCount: totalRevealed,
        hintsUsed: 0,
        emptyHints // <-- store the empty cell hints
    };
}

function renderGrid(grid, template, title, isPuzzle, solution) {
    const section = document.createElement('div');
    section.className = 'puzzle-section';
    /*
    const titleEl = document.createElement('div');
    titleEl.className = 'puzzle-title';
    titleEl.textContent = title;
    section.appendChild(titleEl);
    */
    // Add progress and switch info for puzzles
    if (isPuzzle && currentPuzzleType) {
        const data = currentPuzzles[currentPuzzleType];
        const percentage = Math.round((data.revealedCount / data.totalCells) * 100);
        const progressEl = document.createElement('div');
        progressEl.style.cssText = 'font-size: 0.9em; color: #ffffff80; margin-bottom: 10px; font-weight: normal;';
        progressEl.textContent = `${data.revealedCount}/${data.totalCells} revealed - ${percentage}%`;
        if (data.hintsUsed > 0) {
            progressEl.textContent += ` • ${data.hintsUsed} hints used`;
        }
        // Add other puzzle info
        const otherPuzzle = currentPuzzleType === '4x5' ? '6x5' : '4x5';
        if (currentPuzzles[otherPuzzle]) {
            const otherData = currentPuzzles[otherPuzzle];
            const otherPercentage = Math.round((otherData.revealedCount / otherData.totalCells) * 100);
            progressEl.textContent += ` • ${otherPuzzle.toUpperCase()}: ${otherPercentage}% complete`;
        }
        section.appendChild(progressEl);
    }
    const gridEl = document.createElement('div');
    gridEl.className = 'grid';
    // Track used numbers for empty cells per mask (for this render) -- now unused
    grid.forEach((row, r) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'grid-row';
        row.forEach((cell, c) => {
            const cellEl = document.createElement('div');
            cellEl.className = 'cell';
            // Add data attributes for cell identification
            cellEl.setAttribute('data-puzzle', currentPuzzleType);
            cellEl.setAttribute('data-row', r);
            cellEl.setAttribute('data-col', c);
            const region = template[r][c];
            if (isEmptyCell(region)) {
                cellEl.className += ' empty';
                // Use precomputed hint
                const data = currentPuzzles[currentPuzzleType];
                const hint = data && data.emptyHints ? data.emptyHints[`${r},${c}`] : '-';
                cellEl.textContent = hint;
                // Border logic for third letter
                if (region.length > 2) {
                    const borderSide = region[2];
                    const borderStyle = '2px dashed black';
                    if (borderSide === 't') cellEl.style.borderTop = borderStyle;
                    if (borderSide === 'b') cellEl.style.borderBottom = borderStyle;
                    if (borderSide === 'r') cellEl.style.borderRight = borderStyle;
                    if (borderSide === 'l') cellEl.style.borderLeft = borderStyle;
                }
                // Set lighter region color as background
                const mask = region[1]; // e.g., for '-a', mask is 'a', for '-ar', mask is 'ar'
                if (mask) {
                    cellEl.className += ` region-${mask}`;
                }
            } else {
                cellEl.className += ` region-${region}`;
                if (cell === 0 && isPuzzle) {
                    // Empty cell that can be clicked
                    cellEl.textContent = '?';
                    // cellEl.style.color = '#a0aec0';
                    cellEl.className += ' clickable';
                    cellEl.onclick = () => showNumberInput(currentPuzzleType, r, c);
                    cellEl.onmouseenter = () => { lastActiveCell = { puzzleType: currentPuzzleType, row: r, col: c }; };
                } else {
                    // Cell with a number
                    cellEl.textContent = cell;
                    if (isPuzzle) {
                        // Check if this is a given number or user-revealed
                        const data = currentPuzzles[currentPuzzleType];
                        if (data) {
                            // If this was revealed initially (not from hints), mark as given
                            const wasInitiallyRevealed = data.hintsUsed === 0 || 
                                (data.revealed[r][c] !== 0 && data.revealed[r][c] === data.solution[r][c]);
                            if (wasInitiallyRevealed) {
                                cellEl.className += ' given';
                            }
                        }
                    }
                }
            }
            rowEl.appendChild(cellEl);
        });
        gridEl.appendChild(rowEl);
    });
    section.appendChild(gridEl);
    return section;
}

function startTimer() {
    gameStartTime = Date.now();
    updateTimerDisplay();
    timerPaused = false;
    timerWasPaused = false;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!timerPaused) {
            gameTimer--;
            updateTimerDisplay();
            if (gameTimer <= 0) {
                // Timer expired - end game
                stopTimer();
                showScoreScreen(calculateScore(true));
            }
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function addTimeBonus() {
    gameTimer = Math.max(gameTimer + 2, 0); // Add 2 seconds for correct answer
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const timerDisplayEl = document.getElementById('timerDisplay');
    if (timerDisplayEl) {
        if (timerPaused) {
            timerDisplayEl.innerHTML = '🍺 Paused';
            timerDisplayEl.style.opacity = '0.6';
        } else {
            timerDisplayEl.innerHTML = '⏳ Hourglass: <span id="timerValue">' + Math.max(0, gameTimer) + '</span>s';
            timerDisplayEl.style.opacity = '1';
        }
        // Update timer styling based on remaining time
        timerDisplayEl.className = 'timer-display';
        if (!timerPaused) {
            if (gameTimer <= 3) {
                timerDisplayEl.className += ' timer-critical';
            } else if (gameTimer <= 10) {
                timerDisplayEl.className += ' timer-warning';
            }
        }
        timerDisplayEl.style.cursor = 'pointer';
    }
}

function showNumberInput(puzzleType, row, col) {
    const template = puzzleType === '4x5' ? template4x5 : template6x5;
    const region = template[row][col];
    const validNumbers = getValidNumbers(region);
    const data = currentPuzzles[puzzleType];
    const possibleNumbers = validNumbers.filter(num => isValidPlacement(data.revealed, row, col, num, template));
    selectedCell = { puzzleType, row, col };
    lastActiveCell = { puzzleType, row, col };

    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.onclick = hideNumberInput;

    const popup = document.createElement('div');
    popup.className = 'input-popup';
    const title = document.createElement('h3');
    if (showOnlyPossibleNumbers) {
        title.textContent = "What numbers be possible, matey?";
    } else {
        title.textContent = "Pick yer number, ye scallywag!";
    }
    popup.appendChild(title);

    /*
    const subtitle = document.createElement('p');
    if (showOnlyPossibleNumbers) {
        subtitle.textContent =`Possible numbers: ${possibleNumbers.join(', ')}`;
    } else {
        subtitle.textContent = ``;
    }
    subtitle.style.color = '#666';
    subtitle.style.margin = '0 0 15px 0';
    popup.appendChild(subtitle);
    */

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'number-buttons';
    const numbersToShow = showOnlyPossibleNumbers ? possibleNumbers : validNumbers;
    numbersToShow.forEach(num => {
        const button = document.createElement('button');
        button.className = 'number-btn';
        button.textContent = num;
        button.onclick = () => handleNumberInput(num);
        button.style.background = '#e0e7ff';
        button.style.color = '#222';
        button.style.border = '2px solid #667eea';
        button.style.fontWeight = 'bold';
        buttonContainer.appendChild(button);
    });
    popup.appendChild(buttonContainer);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #e2e8f0; border: none; border-radius: 5px; cursor: pointer; color: #222;';
    cancelBtn.onclick = hideNumberInput;
    popup.appendChild(cancelBtn);

    document.body.appendChild(overlay);
    document.body.appendChild(popup);
}

function hideNumberInput() {
    const overlay = document.querySelector('.popup-overlay');
    const popup = document.querySelector('.input-popup');
    if (overlay) overlay.remove();
    if (popup) popup.remove();
    selectedCell = null;
    showOnlyPossibleNumbers = false;
}

function calculateScore(timerExpired = false) {
    // If timer was paused at any point, score is 0
    if (timerWasPaused) {
        return {
            finalScore: 0,
            resolved: 0,
            totalCells: 0,
            incorrectEntries: 0,
            bonus: 0,
            timeLeft: 0,
            timerExpired,
            paused: true
        };
    }
    const data = currentPuzzles[currentPuzzleType];
    const totalCells = data ? data.totalCells : 0;
    // Only count user-solved cells (not initial clues)
    const resolved = data ? (data.revealedCount - data.initialClues) : 0;
    const wrong = gameStats.incorrectEntries;
    let finalScore = resolved * 500 - wrong * 1000; // 500 points per resolved cell, -1000 per wrong
    let bonus = 0;
    if (!timerExpired && totalCells === resolved + data.initialClues) {
        bonus = gameTimer * 250; // 250 points per second left if finished
        finalScore += bonus;
    }
    return {
        finalScore,
        resolved,
        totalCells: totalCells - data.initialClues,
        incorrectEntries: wrong,
        bonus,
        timeLeft: gameTimer,
        timerExpired
    };
}

function showScoreScreen(scoreData) {
    stopTimer();
    // Hide game controls and timer when showing score
    document.getElementById('resetBtn').style.display = 'none';
    document.getElementById('timerContainer').style.display = 'none';
    const container = document.getElementById('puzzlesContainer');
    container.innerHTML = '';
    const scoreEl = document.createElement('div');
    scoreEl.className = 'score-display';
    let bonusText = '';
    if (scoreData.bonus > 0) {
        bonusText = `<div class="score-item"><div class="score-label">Time Bonus (Booty!)</div><div class="score-value">+${scoreData.bonus}</div></div>`;
    }
    let timerText = scoreData.timerExpired ? '<div style="color:#e74c3c;">⏳ Yer time be up, ye landlubber!</div>' : '';
    let pausedText = scoreData.paused ? '<div style="color:#e74c3c;">⏸️ Ye paused the hourglass — No booty for ye!</div>' : '';
    // Format gameStartTime as HH:MM:SS
    let startedTimeText = '';
    if (gameStartTime) {
        const startDate = new Date(gameStartTime);
        const hours = startDate.getHours().toString().padStart(2, '0');
        const minutes = startDate.getMinutes().toString().padStart(2, '0');
        const seconds = startDate.getSeconds().toString().padStart(2, '0');
        startedTimeText = `<div class=\"score-item\"><div class=\"score-label\">Ye set sail at</div><div class=\"score-value\">${hours}:${minutes}:${seconds}</div></div>`;
    }
    scoreEl.innerHTML = `
        <div class="score-title">🏴‍☠️ The Game Be Over, Matey!</div>
        <div style="font-size: 2em; color: #e74c3c; margin: 10px 0; font-weight: bold;">
            Yer Score: ${scoreData.finalScore}
        </div>
        <div class="score-details">
            <div class="score-item">
                <div class="score-label">Cells Conquered</div>
                <div class="score-value">${scoreData.resolved || 0}/${scoreData.totalCells || 0}</div>
            </div>
            <div class="score-item">
                <div class="score-label">Blunders Made</div>
                <div class="score-value">${scoreData.incorrectEntries || 0}</div>
            </div>
            ${bonusText}
            ${startedTimeText}
        </div>
        ${timerText}
        ${pausedText}
        <div style="margin-top: 15px; color: #7f8c8d; font-style: italic;">
            ☠️ Outwit the crew and claim the treasure by fillin' more cells and finishin' faster!
        </div>
        <button id="backToMenuBtn" style="margin-top: 25px; padding: 12px 32px; background: linear-gradient(45deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; font-size: 1.1em; font-weight: bold; cursor: pointer;">Back to the Main Deck</button>
    `;
    container.appendChild(scoreEl);
    setTimeout(() => {
        const btn = document.getElementById('backToMenuBtn');
        if (btn) btn.onclick = resetGame;
    }, 0);
}

function handleNumberInput(number) {
    if (!selectedCell) return;
    if (gameTimer <= 0) return; // Timer expired, do not process input
    const { puzzleType, row, col } = selectedCell;
    const data = currentPuzzles[puzzleType];
    const template = puzzleType === '4x5' ? template4x5 : template6x5;
    let correctNumber = data.solution[row][col];
    hideNumberInput();
    if (number !== correctNumber) {
        gameStats.incorrectEntries++;
        const cellElement = document.querySelector(`[data-puzzle="${puzzleType}"][data-row="${row}"][data-col="${col}"]`);
        if (cellElement) {
            cellElement.textContent = number;
            cellElement.classList.add('wrong');
            setTimeout(() => {
                cellElement.textContent = '?';
                cellElement.classList.remove('wrong');
            }, 1500);
            showOnlyPossibleNumbers = true;
            showNumberInput(puzzleType, row, col);
        }
        return;
    }
    // Correct answer
    addTimeBonus();
    data.revealed[row][col] = number;
    data.revealedCount++;
    gameStats.resolvedCells = data.revealedCount;
    updateTimerDisplay();
    updateDisplay();
    if (data.revealedCount === data.totalCells) {
        setTimeout(() => {
            const scoreData = calculateScore(false);
            showScoreScreen(scoreData);
            saveScoreToLocalStorage(scoreData);
        }, 100);
    }
}

function startPuzzle(puzzleType) {
    let result = null;
    if (puzzleType === '4x5') {
        result = createPuzzle(template4x5);
        gameTimer = 30;
    } else {
        result = createPuzzle(template6x5);
        gameTimer = 60;
    }
    if (result) {
        currentPuzzles = {};
        currentPuzzles[puzzleType] = result;
        currentPuzzleType = puzzleType;
        gameStats.incorrectEntries = 0;
        gameStats.totalTime = 0;
        gameStats.resolvedCells = 0;
        showGameActionControls(true);
        document.getElementById('resetBtn').style.display = 'inline-block';
        document.getElementById('timerContainer').style.display = 'block';
        startTimer();
        updateDisplay();
        document.getElementById('introScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = '';
    }
}

function resetGame() {
    currentPuzzles = {};
    currentPuzzleType = null;
    showingSolutions = false;
    gameStats.incorrectEntries = 0;
    showGameActionControls(false);
    document.getElementById('resetBtn').style.display = 'none';
    document.getElementById('timerContainer').style.display = 'none';
    stopTimer();
    updateDisplay();
    document.getElementById('introScreen').style.display = '';
    document.getElementById('gameScreen').style.display = 'none';
}

function updateDisplay() {
    const container = document.getElementById('puzzlesContainer');
    container.innerHTML = '';
    
    if (currentPuzzleType && currentPuzzles[currentPuzzleType]) {
        const data = currentPuzzles[currentPuzzleType];
        const template = currentPuzzleType === '4x5' ? template4x5 : template6x5;
        const grid = data.revealed;
        const title = `${currentPuzzleType.toUpperCase()} Hudoku Puzzle`;
        
        container.appendChild(renderGrid(grid, template, title, true, data.solution));

        if (!showingSolutions && data.revealedCount === data.totalCells) {
            setTimeout(() => {
                const scoreData = calculateScore(false);
                showScoreScreen(scoreData);
                saveScoreToLocalStorage(scoreData);
            }, 100);
        }
    }
}

// Helper to save score to localStorage with day of week key
function saveScoreToLocalStorage(scoreData) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const dayKey = days[now.getDay()];
    localStorage.setItem(`hudoku_score_${dayKey}`, JSON.stringify(scoreData));
}

// Add keyboard support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideNumberInput();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const timerDisplayEl = document.getElementById('timerDisplay');
    if (timerDisplayEl) {
        timerDisplayEl.addEventListener('click', function() {
            timerPaused = !timerPaused;
            if (timerPaused) timerWasPaused = true;
            updateTimerDisplay();
            if (!timerPaused) {
                // If unpausing, update the timer value immediately
                updateTimerDisplay();
            }
        });
    }
});

function showGameActionControls(show) {
    document.getElementById('gameActionControls').style.display = show ? 'flex' : 'none';
}

// Show video in introScreen when loaded, otherwise show image
window.addEventListener('DOMContentLoaded', function() {
    var video = document.getElementById('introBgVideo');
    var img = document.getElementById('introBgImg');
    if (video && img) {
        video.addEventListener('canplay', function() {
            img.style.display = 'none';
            video.style.display = 'block';
        });
        // In case video fails to load, keep image visible
    }
});