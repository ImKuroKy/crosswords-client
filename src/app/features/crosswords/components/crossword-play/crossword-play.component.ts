import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrosswordsService } from '../../services/crosswords.service';

// ===== Интерфейсы (пример) ===== //
interface Clue {
  number: number;
  clue: string;
  cells: { row: number; col: number }[];
}

interface Word {
  word: string;
  definition: string;
  length: number;
  row: number;
  col: number;
  direction: 'across' | 'down';
  cells: { row: number; col: number; letter?: string }[];
}

interface CrosswordData {
  title: string;
  width: number;
  height: number;
  grid: string[][];
  words: Word[];
  clues: {
    across: Clue[];
    down: Clue[];
  };
}

interface UserProgress {
  grid: string[][];
  // возможно, ещё какие-то поля
}

@Component({
  selector: 'app-crossword-play',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crossword-play.component.html',
  styleUrls: ['./crossword-play.component.css'],
})
export class CrosswordPlayComponent implements OnInit {
  crosswordId!: string;
  crosswordData: CrosswordData = {
    title: '',
    width: 0,
    height: 0,
    grid: [],
    words: [],
    clues: {
      across: [],
      down: []
    }
  };
  userInputs: Record<string, string> = {};
  solvedWords: Set<string> = new Set();
  isGameCompleted = false;
 
  // Храним прогресс пользователя, который мы подтянем с сервера
  userProgress: UserProgress | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private crosswordsService: CrosswordsService
  ) {}

  ngOnInit(): void {
    this.crosswordId = this.route.snapshot.paramMap.get('crosswordId') || '';
    this.fetchCrosswordData();
  }

  /**
   * 1. Грузим crosswordData (структуру кроссворда).
   * 2. Грузим userProgress (сохранённый прогресс пользователя).
   * 3. Если userProgress не пуст, инициализируем userInputs из него.
   */
  fetchCrosswordData(): void {
    // Пример: сервис может возвращать что-то вроде
    // {
    //   crossword: { content: {...} },
    //   userProgress: { grid: [...] } или null
    // }
    this.crosswordsService.getCrosswordById(this.crosswordId).subscribe({
      next: (response: any) => {
        // 1) Структура кроссворда
        this.crosswordData = response.crossword?.content || null;

        // 2) Прогресс пользователя (может быть null или { grid: [...] })
        this.userProgress = response.userProgress || null;

        // Инициализация userInputs:
        if (this.crosswordData) {
          this.initializeUserInputs();
          // Если есть сохранённый прогресс — подставляем его
          if (this.userProgress && this.userProgress.grid) {
            this.applyUserProgress(this.userProgress.grid);
          }
        }
      },
      error: (err) => {
        console.error('Error fetching crossword data:', err);
      },
    });
  }

  /**
   * Создаём в userInputs пустые строки для всех клеток, которые в words.
   */
  initializeUserInputs(): void {
    if (!this.crosswordData) return;
    this.crosswordData.words.forEach((word) => {
      word.cells.forEach((cell) => {
        const key = `${cell.row}-${cell.col}`;
        if (!this.userInputs[key]) {
          this.userInputs[key] = '';
        }
      });
    });
  }

  /**
   * Если у нас есть сохранённый grid (размером crosswordData.height x crosswordData.width),
   * заполняем userInputs соответствующими буквами.
   */
  applyUserProgress(progressGrid: string[][]): void {
    // Просто пробежимся по этому массиву (row x col)
    // и положим значения в userInputs[row-col], если клетка участвует в словах
    if (!this.crosswordData) return;
    for (let r = 0; r < this.crosswordData.height; r++) {
      for (let c = 0; c < this.crosswordData.width; c++) {
        const key = `${r}-${c}`;
        if (this.userInputs.hasOwnProperty(key)) {
          const letter = progressGrid[r][c] || '';
          this.userInputs[key] = letter; // например "а" или ""
        }
      }
    }
  }

  onInputChange(row: number, col: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.trim().toLowerCase();
    this.userInputs[`${row}-${col}`] = newValue;

    if (!this.crosswordData) return;
    // Проверяем, в каком(их) слове(ах) участвует клетка
    this.crosswordData.words.forEach((word) => {
      const isPartOfWord = word.cells.some((c) => c.row === row && c.col === col);
      if (isPartOfWord) {
        const solved = this.checkWordSolved(word);
        if (solved) {
          this.solvedWords.add(word.word);
        } else {
          this.solvedWords.delete(word.word);
        }
      }
    });
    this.checkGameCompletion();
  }

  checkWordSolved(word: Word): boolean {
    if (!this.crosswordData) return false;
    for (const cell of word.cells) {
      const userLetter = (this.userInputs[`${cell.row}-${cell.col}`] || '').trim().toLowerCase();
      const originalLetter = (this.crosswordData.grid[cell.row][cell.col] || '')
        .trim()
        .toLowerCase();
      if (!userLetter || userLetter !== originalLetter) {
        return false;
      }
    }
    return true;
  }

  isWordSolved(clue: Clue): boolean {
    if (!this.crosswordData) return false;
    const word = this.crosswordData.words.find((w) =>
      w.cells.every((cell) =>
        clue.cells.some(
          (clueCell) => clueCell.row === cell.row && clueCell.col === cell.col
        )
      )
    );
    if (!word) return false;
    return this.checkWordSolved(word);
  }

  checkGameCompletion(): void {
    if (!this.crosswordData) return;
    const allClues = [...this.crosswordData.clues.across, ...this.crosswordData.clues.down];
    this.isGameCompleted = allClues.every((clue) => this.isWordSolved(clue));
    if (this.isGameCompleted) {
      console.log('Game completed!');
      setTimeout(() => {
        this.router.navigate(['/crosswords/user/library']);
      }, 10000);
    }
  }

  // ====== Новая логика для вывода номеров в сетке ====== //
  /**
   * Возвращает массив номеров подсказок, которые начинаются в ячейке (row, col).
   * Т. е. если эта клетка является "первой" для across-слова или down-слова.
   */
  getClueIdentifiers(row: number, col: number): string[] {
    if (!this.crosswordData) return [];
    const identifiers: string[] = [];
  
    this.crosswordData.clues.across.forEach((clue) => {
      const firstCell = clue.cells[0];
      if (firstCell.row === row && firstCell.col === col) {
        identifiers.push(`${clue.number}A`);
      }
    });
    this.crosswordData.clues.down.forEach((clue) => {
      const firstCell = clue.cells[0];
      if (firstCell.row === row && firstCell.col === col) {
        identifiers.push(`${clue.number}D`);
      }
    });
    return identifiers;
  }

  /**
   * Сформировать объект { grid: string[][] } из текущего userInputs и отправить на сервер
   */
  saveProgress(): void {
    if (!this.crosswordData) return;
    // Создаём пустую сетку того же размера
    const progressGrid: string[][] = Array.from({ length: this.crosswordData.height }, () =>
      Array.from({ length: this.crosswordData.width }, () => '')
    );

    // Заполняем
    for (let r = 0; r < this.crosswordData.height; r++) {
      for (let c = 0; c < this.crosswordData.width; c++) {
        const key = `${r}-${c}`;
        progressGrid[r][c] = this.userInputs[key] || '';
      }
    }

    const userProgress: UserProgress = { grid: progressGrid };
    console.log('Saving user progress:', userProgress);

    // вызываем сервис и отправляем userProgress
    this.crosswordsService.saveCrosswordProgress(this.crosswordId, userProgress).subscribe({
      next: () => {
        console.log('Progress saved successfully!');
      },
      error: (err: any) => {
        console.error('Error saving progress:', err);
      },
    });
  }  
}
