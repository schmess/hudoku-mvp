# Hudoku (Half Sudoku) Game Logic

This document describes the core logic and algorithms behind the Hudoku (Half Sudoku) puzzle game, focusing on the data structures, puzzle generation, solving, and gameplay loop. The goal is to provide a language-agnostic, pseudocode-based guide for reimplementing the game in any programming language.

---

## 1. Data Structures

### 1.1. Puzzle Template
- **Type:** 2D Array of Strings
- **Purpose:** Defines the regions and empty cells in the puzzle grid.
- **Example:**
  ```
  template4x5 = [
    ['a', 'a', 'a', 'b', 'b'],
    ['a', 'a', 'a', 'b', 'b'],
    ['a', 'a', 'a', 'd', 'd'],
    ['-a', '-a', '-a', 'd', 'd']
  ]
  ```
  - `'a'`, `'b'`, `'c'`, `'d'`: Region identifiers
  - `'-a'`, `'-c'`: Empty cells associated with a region

### 1.2. Puzzle State
- **solution**: 2D Array of Ints/Strings — The fully solved puzzle grid.
- **revealed**: 2D Array of Ints/Strings — The current state of the puzzle as seen by the player (0 for hidden, number for revealed, '-' for empty cell).
- **emptyHints**: Map from cell coordinates to number — Hints for empty cells.
- **revealedCount**: Int — Number of cells revealed so far.
- **totalCells**: Int — Total number of fillable cells.
- **hintsUsed**: Int — Number of hints used.

### 1.3. Game Stats
- **hintsUsed**: Int — Number of auto-hints triggered.
- **incorrectEntries**: Int — Number of wrong answers.
- **totalTime**: Int — Total time spent (seconds).

---

## 2. Core Algorithms

### 2.1. Puzzle Solver (Backtracking)
**Purpose:** Fill the grid so that no number repeats in any row, column, or region.

**Pseudocode:**
```
function solvePuzzle(template, givenGrid = null):
    grid = copy of givenGrid if provided, else initialize from template (0 for fillable, '-' for empty)
    function backtrack():
        for each row r in grid:
            for each column c in grid[r]:
                if grid[r][c] == 0:
                    region = template[r][c]
                    validNumbers = getValidNumbers(region)
                    for num in validNumbers:
                        if isValidPlacement(grid, r, c, num, template):
                            grid[r][c] = num
                            if backtrack():
                                return true
                            grid[r][c] = 0
                    return false
        return true
    if backtrack():
        return grid
    else:
        return null
```

### 2.2. Valid Placement Check
**Purpose:** Ensure a number can be placed at (row, col) without violating Sudoku rules.

**Pseudocode:**
```
function isValidPlacement(grid, row, col, num, template):
    // Row constraint
    for c in 0..grid[row].length:
        if c != col and grid[row][c] == num:
            return false
    // Column constraint
    for r in 0..grid.length:
        if r != row and grid[r][col] == num:
            return false
    // Region constraint
    region = template[row][col]
    for r in 0..template.length:
        for c in 0..template[r].length:
            if template[r][c] == region and (r != row or c != col):
                if grid[r][c] == num:
                    return false
    return true
```

### 2.3. Puzzle Generation
**Purpose:** Generate a new puzzle with a unique solution and initial revealed numbers.

**Pseudocode:**
```
function createPuzzle(template):
    solution = solvePuzzle(template)
    revealed = grid of 0s (hidden) or '-' (empty) based on template
    regionCells = map from region to list of (row, col)
    for each cell in template:
        if not empty:
            add (row, col) to regionCells[region]
    for each region in regionCells:
        n = number of clues to reveal for this region
        randomly select n cells in regionCells[region]
        for each selected cell:
            revealed[row][col] = solution[row][col]
    // Generate empty cell hints
    for each cell in template:
        if cell is empty:
            assign a hint number not already revealed in the region, row, or column
    return { solution, revealed, ... }
```

---

## 3. Main Game Loop

**Pseudocode:**
```
initialize game state
while game not complete:
    display puzzle grid
    start or update timer
    if player clicks a cell:
        show number input popup
        if input is correct:
            reveal cell, add time bonus
        else:
            increment incorrectEntries, show error feedback
    if timer runs out:
        auto-reveal a cell (auto-hint), increment hintsUsed, reset timer
    if player requests a hint:
        reveal a random unrevealed cell, increment hintsUsed, reset timer
    if player requests solution:
        display solution grid
    if all fillable cells are revealed:
        stop timer, calculate score, show score screen
```

---

## 4. Scoring System
- **Base Score:** 10,000 points
- **Time Penalty:** -10 points per second elapsed
- **Hint Penalty:** -500 points per auto-hint or manual hint
- **Error Penalty:** -250 points per wrong entry
- **Final Score:** `max(0, baseScore - timePenalty - hintPenalty - errorPenalty)`

---

## 5. Additional Notes
- **Timer:** Starts at 30 seconds, resets to 30 on correct answer or hint.
- **Auto-Hint:** When timer reaches 0, a cell is revealed automatically.
- **Regions:**
  - Regions A & C: Use numbers 1-9
  - Regions B & D: Use numbers 1-4
- **Empty Cells:** Marked with `'-a'`, `'-c'`, etc., and display a hint number.

---

## 6. Example Data Structure (in pseudocode)
```
puzzle = {
    solution: [[...], ...],
    revealed: [[...], ...],
    emptyHints: { 'row,col': number, ... },
    revealedCount: int,
    totalCells: int,
    hintsUsed: int
}
gameStats = {
    hintsUsed: int,
    incorrectEntries: int,
    totalTime: int
}
```

---

## 7. Reimplementation Tips
- Use 2D arrays for grids.
- Use maps/dictionaries for region and hint tracking.
- Use a recursive backtracking algorithm for solving.
- Keep UI and game logic separate for easier porting.
- Use event-driven input handling for user actions.

---

For any questions or clarifications, refer to the pseudocode above or the original implementation. 