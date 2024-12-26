import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  gridValues: string[][] = []; // Массив для хранения значений, введенных пользователем
  

  constructor(
    private route: ActivatedRoute,
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


  
  // Обработчик изменений в поле ввода
  onInputChange(rowIndex: number, colIndex: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.toUpperCase(); // Приводим к верхнему регистру
    this.gridValues[rowIndex][colIndex] = newValue;
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
