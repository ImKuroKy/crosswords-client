import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CrosswordsService } from '../../services/crosswords.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  cells: { row: number; col: number }[];
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

interface GridCellState {
  isLocked: boolean; // Клетка заблокирована или нет (для клеток, где нет буквы)
  hasLetter: boolean; // Есть ли буква в клетке (для отображения пустого input)
}

interface CrosswordState {
  gridState: GridCellState[][]; // Состояние клеток сетки
}

@Component({
  selector: 'app-crossword-play',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crossword-play.component.html',
  styleUrl: './crossword-play.component.css',
})
export class CrosswordPlayComponent implements OnInit {
  crosswordId!: string;
  crosswordData: CrosswordData | any;
  crosswordState: CrosswordState | any;
  userInputs: { [key: string]: string } = {}; // Для хранения ввода пользователя
  solvedWords: Set<string> = new Set(); // Множество решённых слов
  gridValues: string[][] = []; // Массив для хранения значений, введенных пользователем
  isGameCompleted: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private crosswordsService: CrosswordsService
  ) {}

  ngOnInit() {
    this.crosswordId = this.route.snapshot.paramMap.get('crosswordId')!;
    this.fetchCrosswordData(); // Загружаем данные кроссворда
  }

  // Метод для получения данных кроссворда из сервиса
  fetchCrosswordData() {
    this.crosswordsService.getCrosswordById(this.crosswordId).subscribe({
      next: (data: any) => {
        this.crosswordData = data.crossword.content; // Извлекаем нужные данные из JSON
        this.crosswordData.grid = data.crossword.content.grid;
        this.initializeGridValues(); // Инициализируем массив для значений
        this.initializeGridState(); // Инициализируем состояние клеток

        this.initializeUserInputs();
      },
      error: (error) => {
        console.error('Error fetching crossword data:', error);
      },
    });
  }

  // Инициализируем gridValues, основываясь на данных из grid
  initializeGridValues() {
    if (this.crosswordData) {
      this.gridValues = this.crosswordData.grid.map((row: any[]) =>
        row.map(() => '')
      );
    }
  }

  // Инициализируем crosswordState на основе данных из grid и words
  initializeGridState() {
    if (this.crosswordData) {
      const state: GridCellState[][] = [];
      for (let rowIndex = 0; rowIndex < this.crosswordData.height; rowIndex++) {
        const rowState: GridCellState[] = [];
        for (
          let colIndex = 0;
          colIndex < this.crosswordData.width;
          colIndex++
        ) {
          const cell = this.crosswordData.grid[rowIndex][colIndex];
          let isLocked = false;
          let hasLetter = false;

          // Если в клетке уже есть буква, то блокируем её
          if (cell) {
            isLocked = true;
            hasLetter = true;
          }

          // Проверяем, есть ли слово в текущей клетке
          this.crosswordData.words.forEach((word: { cells: any[] }) => {
            word.cells.forEach((wordCell) => {
              if (wordCell.row === rowIndex && wordCell.col === colIndex) {
                hasLetter = true;
                isLocked = true;
              }
            });
          });

          rowState.push({ isLocked, hasLetter });
        }
        state.push(rowState);
      }
      this.crosswordState = { gridState: state };
    }
  }

  initializeUserInputs() {
    // Инициализируем userInputs пустыми значениями для всех клеток
    this.crosswordData?.words.forEach((word: { cells: any[] }) => {
      word.cells.forEach((cell: { row: any; col: any }) => {
        const key = `${cell.row}-${cell.col}`;
        this.userInputs[key] = ''; // Пустое значение для ввода
      });
    });
  }

  // Проверка, совпадает ли введённое слово с оригиналом
  checkWordSolved(word: Word): boolean {
    let isSolved = true;
    word.cells.forEach((cell) => {
      const userInput = this.userInputs[`${cell.row}-${cell.col}`];
      const originalLetter = this.crosswordData?.grid[cell.row][cell.col] || '';
      console.log(
        `Checking cell (${cell.row}, ${cell.col}): userInput = ${userInput}, originalLetter = ${originalLetter}`
      );
      if (userInput !== originalLetter) {
        isSolved = false;
      }
    });
    console.log(`Word ${word.word} solved: ${isSolved}`);
    return isSolved;
  }

  // Обработчик ввода
  onInputChange(row: number, col: number, event: any) {
    const inputValue = event.target.value.toLowerCase();
    const key = `${row}-${col}`;
    this.userInputs[key] = inputValue; // Обновляем ввод пользователя

    // Проверяем, если все буквы в слове совпадают, то помечаем слово как решённое
    this.crosswordData?.words.forEach((word: Word) => {
      if (
        word.cells.some(
          (cell: { row: number; col: number }) =>
            cell.row === row && cell.col === col
        )
      ) {
        if (this.checkWordSolved(word)) {
          this.solvedWords.add(word.word); // Добавляем слово в решённые
        } else {
          this.solvedWords.delete(word.word); // Убираем слово из решённых
        }
      }
    });
    this.checkGameCompletion();
  }

  checkGameCompletion() {
    const allWords = [...this.crosswordData.clues.across, ...this.crosswordData.clues.down];
    this.isGameCompleted = allWords.every(clue => this.isWordSolved(clue));
    if (this.isGameCompleted) {
      setTimeout(() => {
        this.router.navigate(['/crosswords/user/library']);
      }, 10000); // 10 секунд
    }
  }

  // Проверка, решено ли слово
  isWordSolved(clue: Clue): boolean {
    const word = this.crosswordData?.words.find((w: { cells: any[]; }) =>
      w.cells.some((cell: { row: number; col: number; }) =>
        clue.cells.some(
          (clueCell) => clueCell.row === cell.row && clueCell.col === cell.col
        )
      )
    );

    if (!word) return false;

    return this.checkWordSolved(word);
  }

  // Функция сохранения данных
  saveCrossword() {
    console.log(
      'Сохраняем кроссворд с введенными значениями:',
      this.gridValues
    );
    // Реализуйте логику сохранения
  }
}
