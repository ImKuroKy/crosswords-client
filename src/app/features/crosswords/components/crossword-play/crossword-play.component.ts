import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrosswordsService } from '../../services/crosswords.service';

// ===== Интерфейсы ===== //
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
      down: [],
    },
  };

  userInputs: Record<string, string> = {};
  solvedWords: Set<string> = new Set();
  isGameCompleted = false;

  // Прогресс пользователя
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
   * 3. Если есть сохранённый прогресс, применяем его в userInputs.
   */
  fetchCrosswordData(): void {
    this.crosswordsService.getCrosswordById(this.crosswordId).subscribe({
      next: (response: any) => {
        // Предположим, сервер возвращает уже готовую структуру
        // (Если вернёт что-то вроде { crossword: {...} }, нужно поправить строку ниже)
        this.crosswordData = response;
        console.log('Crossword data from server:', this.crosswordData);

        // Если на сервере не приходят width/height, берём их из размера массива .grid:
        if (this.crosswordData.grid.length > 0) {
          this.crosswordData.height = this.crosswordData.grid.length;
          this.crosswordData.width = this.crosswordData.grid[0].length;
        }

        // Далее грузим прогресс
        this.crosswordsService.getUserCrosswordProgress(this.crosswordId).subscribe({
          next: (res: any) => {
            // Теперь сервер возвращает, напр., { grid: [ [..], [..] ] }
            console.log('User progress response:', res);
            // Присваиваем напрямую
            this.userProgress = res; // res = { grid: ... }

            // Инициализация
            this.initializeUserInputs();

            // Если есть сохранённый grid, применим
            if (this.userProgress && this.userProgress.grid) {
              console.log('Applying user progress:', this.userProgress.grid);
              this.applyUserProgress(this.userProgress.grid);
            }
          },
          error: (err) => {
            console.error('Error fetching user progress:', err);
          },
        });
      },
      error: (err) => {
        console.error('Error fetching crossword data:', err);
      },
    });
  }

  /**
   * Создаём пустые записи userInputs для всех клеток, которые входят в слова.
   */
  initializeUserInputs(): void {
    if (!this.crosswordData) return;
    // Пробегаем по всем словам
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
   * Прогресс (progressGrid) - двумерный массив [r][c].
   * Записываем буквы в userInputs, если есть такая ячейка.
   */
  applyUserProgress(progressGrid: string[][]): void {
    if (!this.crosswordData) return;
    for (let r = 0; r < this.crosswordData.height; r++) {
      for (let c = 0; c < this.crosswordData.width; c++) {
        const key = `${r}-${c}`;
        if (this.userInputs.hasOwnProperty(key)) {
          const letter = progressGrid[r][c] || '';
          this.userInputs[key] = letter; 
        }
      }
    }
  }

  // Событие при вводе буквы
  onInputChange(row: number, col: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.trim().toLowerCase();
    this.userInputs[`${row}-${col}`] = newValue;

    if (!this.crosswordData) return;
    // Проверка, к какому слову принадлежит клетка
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
      const userLetter = (this.userInputs[`${cell.row}-${cell.col}`] || '').toLowerCase();
      const originalLetter = (this.crosswordData.grid[cell.row][cell.col] || '').toLowerCase();
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
        clue.cells.some((clueCell) => clueCell.row === cell.row && clueCell.col === cell.col)
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

  // Нумерация подсказок
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

  // Сохранить прогресс
  saveProgress(): void {
    if (!this.crosswordData) return;
    const progressGrid: string[][] = Array.from({ length: this.crosswordData.height }, () =>
      Array.from({ length: this.crosswordData.width }, () => '')
    );

    for (let r = 0; r < this.crosswordData.height; r++) {
      for (let c = 0; c < this.crosswordData.width; c++) {
        const key = `${r}-${c}`;
        progressGrid[r][c] = this.userInputs[key] || '';
      }
    }

    const userProgress: UserProgress = { grid: progressGrid };
    console.log('Saving user progress:', userProgress);

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
