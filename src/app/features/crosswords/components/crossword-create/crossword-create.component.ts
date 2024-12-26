import { Component, OnInit } from '@angular/core';
import { DictionaryService } from '../../services/dictionaries.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CrosswordsService } from '../../services/crosswords.service';

interface FormData {
  title: string;
  width: number;
  height: number;
  hints: number;
  dictionary: string;
  fillMethod: string;
}

interface Word {
  word: string;
  definition: string;
}

@Component({
  selector: 'app-crossword-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crossword-create.component.html',
  styleUrls: ['./crossword-create.component.css'],
})
export class CrosswordCreateComponent implements OnInit {
  formData: FormData;
  grid: string[][] | any;
  words: {
    id: number;
    word: string;
    length: number;
    row: number;
    col: number;
    direction: string;
  }[] = [];
  selectedCells: { row: number; col: number }[] = [];
  currentWordIndex = 0;
  dictionary: Word[] = [];
  errorMessage = '';
  selectedWords: {
    length: number;
    cells: { row: number; col: number }[];
    word: string;
  }[] = [];

  constructor(
    private router: Router,
    private dictionaryService: DictionaryService,
    private crosswordsService: CrosswordsService
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.formData = navigation?.extras?.state?.['formData'] || {
      title: '',
      width: 4,
      height: 4,
      hints: 0,
      dictionary: '',
      fillMethod: 'manual',
    };
  }

  ngOnInit(): void {
    // Получаем данные из localStorage
    const storedFormData = localStorage.getItem('crosswordFormData');
    if (storedFormData) {
      this.formData = JSON.parse(storedFormData);
      console.log('Form data received in crossword-create:', this.formData);
      this.loadDictionary();
    } else {
      console.error('No form data found in localStorage');
    }
    this.initializeGrid();
  }

  initializeGrid(): void {
    this.grid = Array.from({ length: this.formData.height }, () =>
      Array(this.formData.width).fill('')
    );
  }
  loadDictionary(): void {
    console.log(
      'Dictionary name before service call:',
      this.formData.dictionary
    );
    this.dictionaryService
      .getDictionaryByName(this.formData.dictionary)
      .subscribe({
        next: (data) => {
          // Логируем ответ сервера, чтобы понять структуру данных
          console.log('Dictionary loaded:', data);

          // Парсим content, который приходит как строка JSON
          try {
            const parsedContent = JSON.parse(data.content); // Здесь мы парсим строку JSON
            this.dictionary = parsedContent.words || []; // Достаем массив слов или пустой массив, если его нет
            console.log('Parsed dictionary:', this.dictionary);
          } catch (error) {
            this.errorMessage = 'Error parsing dictionary content';
            console.error('Error parsing dictionary content:', error);
          }
        },
        error: (error) => {
          this.errorMessage = 'Error loading dictionary';
          console.error('Error loading dictionary:', error);
        },
        complete: () => {
          console.log('Dictionary loading complete');
        },
      });
  }

  startSelection(row: number, col: number): void {
    // Очищаем массив selectedWords от пустых слов
    this.selectedWords = this.selectedWords.filter(
      (wordObj) => wordObj.word !== ''
    );
    this.selectedCells = [{ row, col }];
  }

  continueSelection(row: number, col: number): void {
    if (this.selectedCells.length) {
      this.selectedCells.push({ row, col });
    }
  }

  endSelection(): void {
    if (this.selectedCells.length < 2) return;

    const length = this.selectedCells.length;
    this.selectedWords.push({
      length,
      cells: [...this.selectedCells],
      word: '',
    });
    this.selectedCells = [];
    this.errorMessage = '';
  }

  filterWords(selectedCells: { row: number; col: number }[]): Word[] {
    if (!Array.isArray(this.dictionary)) {
      console.error('Dictionary is not an array or undefined', this.dictionary);
      return [];
    }

    const validWords: Word[] = [];
    const wordLength = selectedCells.length;

    this.dictionary.forEach((word) => {
      if (word.word.length === wordLength) {
        const isValid = selectedCells.every((cell, index) => {
          const gridLetter = this.grid[cell.row][cell.col];
          const wordLetter = word.word[index];
          return gridLetter === '' || gridLetter === wordLetter;
        });

        if (isValid) {
          validWords.push(word);
        }
      }
    });

    return validWords;
  }

  // Выбираем слово из выпадающего списка
  selectWord(
    event: Event,
    wordObj: {
      length: number;
      cells: { row: number; col: number }[];
      word: string;
    }
  ): void {
    const target = event.target as HTMLSelectElement;
    const selectedWord = target.value;
    wordObj.word = selectedWord;
    this.fillGrid(wordObj);
  }

  // Заполняем сетку выбранным словом
  fillGrid(wordObj: {
    length: number;
    cells: { row: number; col: number }[];
    word: string;
  }): void {
    const { word, cells } = wordObj;
    cells.forEach((cell, index) => {
      this.grid[cell.row][cell.col] = word[index];
    });
  }

  // Метод для проверки, является ли клетка выбранной
  isSelectedCell(rowIndex: number, colIndex: number): boolean {
    return this.selectedCells.some(
      (cell) => cell.row === rowIndex && cell.col === colIndex
    );
  }

  saveCrossword(): void {
    const crosswordData = {
      title: this.formData.title,
      width: this.formData.width,
      height: this.formData.height,
      hints: this.formData.hints,
      fillMethod: this.formData.fillMethod,
      dictionary: this.formData.dictionary,
      grid: this.grid,
      words: this.selectedWords.map((wordObj) => ({
        word: wordObj.word,
        definition: this.getWordDefinition(wordObj.word),
        length: wordObj.length,
        row: wordObj.cells[0].row,
        col: wordObj.cells[0].col,
        direction: this.getWordDirection(wordObj),
        cells: wordObj.cells,
      })),
      clues: this.generateClues(),
    };

    console.log('Crossword Data:', crosswordData);

    // Отправляем данные на сервер через сервис
    this.crosswordsService.saveCrossword(crosswordData).subscribe({
      next: (response) => {
        console.log('Кроссворд успешно сохранен:', response);
        this.router.navigate(['/crosswords/library']); // Перенаправляем пользователя после успешного сохранения
      },
      error: (error) => {
        console.error('Ошибка при сохранении кроссворда:', error);
      },
      complete: () => {
        console.log('Процесс сохранения завершен');
      },
    });
  }

  getWordDefinition(word: string): string {
    // Поиск определения слова в словаре
    const wordObj = this.dictionary.find((w) => w.word === word);
    return wordObj ? wordObj.definition : '';
  }

  getWordDirection(wordObj: {
    length: number;
    cells: { row: number; col: number }[];
  }): string {
    // Определение направления (горизонталь или вертикаль)
    const isHorizontal = wordObj.cells[0].row === wordObj.cells[1]?.row;
    return isHorizontal ? 'across' : 'down';
  }

  generateClues() {
    const across: {
      number: number;
      clue: string;
      cells: { row: number; col: number }[];
    }[] = [];
    const down: {
      number: number;
      clue: string;
      cells: { row: number; col: number }[];
    }[] = [];

    this.selectedWords.forEach((wordObj) => {
      const clue = {
        number: this.getClueNumber(wordObj),
        clue: this.getWordDefinition(wordObj.word),
        cells: wordObj.cells,
      };
      if (this.getWordDirection(wordObj) === 'across') {
        across.push(clue);
      } else {
        down.push(clue);
      }
    });

    return { across, down };
  }

  getClueNumber(wordObj: { cells: { row: number; col: number }[] }): number {
    return (
      wordObj.cells[0].row * this.formData.width + wordObj.cells[0].col + 1
    );
  }
}