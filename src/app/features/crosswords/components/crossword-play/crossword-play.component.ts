import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrosswordsService } from '../../services/crosswords.service';
import { NotificationComponent } from '../../../../shared/notification/notification.component';

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
  hints: number;
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
  imports: [CommonModule, FormsModule, NotificationComponent],
  templateUrl: './crossword-play.component.html',
  styleUrls: ['./crossword-play.component.css'],
})
export class CrosswordPlayComponent implements OnInit {
  @ViewChild(NotificationComponent) notification!: NotificationComponent;
  crosswordId!: string;

  crosswordData: CrosswordData = {
    title: '',
    width: 0,
    height: 0,
    grid: [],
    words: [],
    hints: 0,
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
    // Получаем данные кроссворда с сервера
    this.crosswordsService.getCrosswordById(this.crosswordId).subscribe({
      next: (response: any) => {
        console.log('Crossword data from server:', response);

        // Проверяем и инициализируем данные кроссворда
        this.crosswordData = response || {};
        this.crosswordData.grid = this.crosswordData.grid || [];
        this.crosswordData.height =
          this.crosswordData.height || this.crosswordData.grid.length || 0;
        this.crosswordData.width =
          this.crosswordData.width || this.crosswordData.grid[0]?.length || 0;

        // Загружаем прогресс пользователя
        this.crosswordsService
          .getUserCrosswordProgress(this.crosswordId)
          .subscribe({
            next: (res: any) => {
              console.log('User progress response:', res);

              // Если прогресс отсутствует, оставляем сетку кроссворда без изменений
              this.userProgress = res || { grid: null };

              // Инициализация пользовательского ввода
              this.initializeUserInputs();

              // Если есть пользовательский прогресс, применяем его к текущему кроссворду
              if (this.userProgress?.grid) {
                console.log('Applying user progress:', this.userProgress.grid);
                this.applyUserProgress(this.userProgress.grid);
              } else {
                console.log('No user progress available, using default grid.');
              }
            },
            error: (err) => {
              console.error('Error fetching user progress:', err);
              // Если прогресс не загрузился, инициализируем пустой ввод
              this.userProgress = { grid: [] };
              this.initializeUserInputs();
            },
          });
      },
      error: (err) => {
        console.error('Error fetching crossword data:', err);
        this.notification.show(
          `Произошла ошибка при получении кроссворда. Попробуйте ещё раз. Вот причина возникновения ошибки: ${err}`,
          'error'
        );
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

  /**
   * Нажатие на кнопку "?" для слова (clue).
   * Если есть подсказки (this.crosswordData.hints > 0), то заполняем все буквы этого слова.
   * Затем уменьшаем this.crosswordData.hints на 1.
   */
  useHint(clue: Clue): void {
    if (this.crosswordData.hints <= 0) {
      console.log('No more hints available!');
      return;
    }

    // Находим Word, соответствующее этому clue
    const word = this.crosswordData.words.find((w) =>
      w.cells.every((cell) =>
        clue.cells.some(
          (clueCell) => clueCell.row === cell.row && clueCell.col === cell.col
        )
      )
    );
    if (!word) {
      console.log('Cannot find word for this clue');
      return;
    }

    // Проставляем в userInputs все буквы
    word.cells.forEach((cell) => {
      const originalLetter = this.crosswordData.grid[cell.row][cell.col];
      this.userInputs[`${cell.row}-${cell.col}`] = originalLetter;
    });

    // уменьшаем количество подсказок
    this.crosswordData.hints--;

    // после заполнения проверим, solved ли слово
    const solved = this.checkWordSolved(word);
    if (solved) {
      this.solvedWords.add(word.word);
    } else {
      this.solvedWords.delete(word.word);
    }
    this.checkGameCompletion();
  }

  // Событие при вводе буквы
  onInputChange(row: number, col: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.trim().toLowerCase();
    this.userInputs[`${row}-${col}`] = newValue;

    if (!this.crosswordData) return;
    // Проверка, к какому слову принадлежит клетка
    this.crosswordData.words.forEach((word) => {
      const isPartOfWord = word.cells.some(
        (c) => c.row === row && c.col === col
      );
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
      const userLetter = (
        this.userInputs[`${cell.row}-${cell.col}`] || ''
      ).toLowerCase();
      const originalLetter = (
        this.crosswordData.grid[cell.row][cell.col] || ''
      ).toLowerCase();
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
    const allClues = [
      ...this.crosswordData.clues.across,
      ...this.crosswordData.clues.down,
    ];
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
    const progressGrid: string[][] = Array.from(
      { length: this.crosswordData.height },
      () => Array.from({ length: this.crosswordData.width }, () => '')
    );

    for (let r = 0; r < this.crosswordData.height; r++) {
      for (let c = 0; c < this.crosswordData.width; c++) {
        const key = `${r}-${c}`;
        progressGrid[r][c] = this.userInputs[key] || '';
      }
    }

    const userProgress: UserProgress = { grid: progressGrid };
    console.log('Saving user progress:', userProgress);

    this.crosswordsService
      .saveCrosswordProgress(this.crosswordId, userProgress)
      .subscribe({
        next: () => {
          console.log('Progress saved successfully!');
          this.notification.show('Сохранено успешно!', 'success');
        },
        error: (err: any) => {
          console.error('Error saving progress:', err);
          this.notification.show('Не удалось сохранить', 'error');
        },
      });
  }

  onBlurSave(): void {
    if (!this.crosswordData) return;
    const progressGrid: string[][] = Array.from(
      { length: this.crosswordData.height },
      () => Array.from({ length: this.crosswordData.width }, () => '')
    );

    for (let r = 0; r < this.crosswordData.height; r++) {
      for (let c = 0; c < this.crosswordData.width; c++) {
        const key = `${r}-${c}`;
        progressGrid[r][c] = this.userInputs[key] || '';
      }
    }

    const userProgress: UserProgress = { grid: progressGrid };

    this.crosswordsService
      .saveCrosswordProgress(this.crosswordId, userProgress)
      .subscribe({
        next: () => {
          console.log('Progress saved successfully!');
        },
        error: (err: any) => {
          console.error('Error saving progress:', err);
        },
      });
  }
}
