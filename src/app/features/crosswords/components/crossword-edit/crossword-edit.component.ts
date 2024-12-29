import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DictionaryService } from '../../services/dictionaries.service';
import { CrosswordsService } from '../../services/crosswords.service';

interface FormData {
  title: string;
  width: number;
  height: number;
  hints: number;
  dictionary: string;
  fillMethod: string;
}

interface DictionaryWord {
  word: string;
  definition: string;
}

interface SelectedWordObj {
  length: number;
  cells: { row: number; col: number }[];
  word: string; 
}

@Component({
  selector: 'app-crossword-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crossword-edit.component.html',
  styleUrls: ['./crossword-edit.component.css'],
})
export class CrosswordEditComponent implements OnInit {
  crosswordId!: string;

  formData: FormData = {
    title: '',
    width: 4,
    height: 4,
    hints: 0,
    dictionary: '',
    fillMethod: 'manual',
  };

  // "Сетка" с буквами
  grid: string[][] = [];

  // Список слов из словаря
  dictionary: DictionaryWord[] = [];

  // Список "выделенных" (проставленных) слов, которые уже есть + новые
  selectedWords: SelectedWordObj[] = [];

  // При drag&select:
  selectedCells: { row: number; col: number }[] = [];

  // Сообщение об ошибке
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dictionaryService: DictionaryService,
    private crosswordsService: CrosswordsService
  ) {}

  ngOnInit(): void {
    // Получаем id кроссворда из роутера
    this.crosswordId = this.route.snapshot.paramMap.get('id') || '';

    // Грузим данные кроссворда с сервера
    this.fetchCrosswordData();

    // При желании, можно грузить dictionary позже (или параллельно)
    // либо вытащить из кроссворда, если оно сохранено.
    this.loadDictionary();
  }

  fetchCrosswordData(): void {
    this.crosswordsService.getCrosswordById(this.crosswordId).subscribe({
      next: (response: any) => {
        // Предположим, сервер возвращает:
        // {
        //   id: "...",
        //   title: "...",
        //   width: 4,
        //   height: 4,
        //   grid: [...],
        //   words: [...],
        //   dictionary: "...",
        //   hints: 0,
        //   fillMethod: "manual"
        // }
        // Заполняем всё нужное
        this.formData.title = response.title;
        this.formData.width = response.width;
        this.formData.height = response.height;
        this.formData.hints = response.hints || 0;
        this.formData.dictionary = response.dictionary || '';
        this.formData.fillMethod = response.fillMethod || 'manual';

        // Сетка
        this.grid = response.grid; // уже готовый массив letters

        // Переводим массив words в selectedWords
        this.selectedWords = response.words.map((w: any) => ({
          length: w.length,
          cells: w.cells,
          word: w.word,
        }));
      },
      error: (err) => {
        console.error('Failed to fetch crossword data', err);
      },
    });
  }

  loadDictionary(): void {
    if (!this.formData.dictionary) return;

    this.dictionaryService.getDictionaryByName(this.formData.dictionary).subscribe({
      next: (data) => {
        try {
          const parsedContent = JSON.parse(data.content);
          this.dictionary = parsedContent.words || [];
          console.log('Dictionary loaded:', this.dictionary);
        } catch (error) {
          this.errorMessage = 'Error parsing dictionary content';
          console.error('Error parsing dictionary content:', error);
        }
      },
      error: (error) => {
        this.errorMessage = 'Error loading dictionary';
        console.error('Error loading dictionary:', error);
      },
    });
  }

  // Начало выделения
  startSelection(row: number, col: number): void {
    // Удаляем пустые wordObj
    this.selectedWords = this.selectedWords.filter((w) => w.word !== '');
    this.selectedCells = [{ row, col }];
  }

  // Продолжаем выделение
  continueSelection(row: number, col: number): void {
    if (this.selectedCells.length) {
      this.selectedCells.push({ row, col });
    }
  }

  // Завершаем выделение
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

  // Фильтр слов из словаря
  filterWords(
    selectedCells: { row: number; col: number }[],
    wordObj?: SelectedWordObj
  ): DictionaryWord[] {
    if (!Array.isArray(this.dictionary)) return [];

    const wordLength = selectedCells.length;
    const usedWords = this.selectedWords.map((sw) => sw.word.toLowerCase());

    const validWords: DictionaryWord[] = this.dictionary.filter((dictItem) => {
      if (dictItem.word.length !== wordLength) return false;

      // Соответствие уже стоящим буквам
      const isCompatible = selectedCells.every((cell, index) => {
        const gridLetter = this.grid[cell.row][cell.col];
        const dictLetter = dictItem.word[index];
        if (gridLetter && gridLetter !== '') {
          return gridLetter.toLowerCase() === dictLetter.toLowerCase();
        }
        return true;
      });
      if (!isCompatible) return false;

      // Исключаем слова, уже выбранные (но оставляем, если это то же самое словоObj)
      if (
        usedWords.includes(dictItem.word.toLowerCase()) &&
        wordObj?.word.toLowerCase() !== dictItem.word.toLowerCase()
      ) {
        return false;
      }

      return true;
    });

    validWords.sort((a, b) => a.word.localeCompare(b.word, 'ru'));
    return validWords;
  }

  // При выборе слова из селекта
  selectWord(event: Event, wordObj: SelectedWordObj) {
    const target = event.target as HTMLSelectElement;
    const selectedWord = target.value;
    wordObj.word = selectedWord;

    // (Если нужна валидация пересечений, дефектов и т. д., 
    //  можно вставить метод validateNewWord, как в "create" компоненте.)
    //  Если не нужно — или делайте по желанию.
    
    this.fillGrid(wordObj);
  }

  fillGrid(wordObj: SelectedWordObj): void {
    const { word, cells } = wordObj;
    cells.forEach((cell, index) => {
      this.grid[cell.row][cell.col] = word[index];
    });
  }

  // Удаление слова
  removeSelectedWord(wordObj: SelectedWordObj) {
    for (const cell of wordObj.cells) {
      const { row, col } = cell;
      // Проверяем, нужно ли стирать букву: 
      // если её не использует другое слово
      const usedByAnother = this.selectedWords.some((w) => {
        if (w === wordObj || w.word === '') return false;
        return w.cells.some((c) => c.row === row && c.col === col);
      });
      if (!usedByAnother) {
        this.grid[row][col] = '';
      }
    }
    const idx = this.selectedWords.indexOf(wordObj);
    if (idx !== -1) {
      this.selectedWords.splice(idx, 1);
    }
  }

  // Проверка, является ли клетка "выделенной" (только во время drag&select)
  isSelectedCell(rowIndex: number, colIndex: number): boolean {
    return this.selectedCells.some(
      (cell) => cell.row === rowIndex && cell.col === colIndex
    );
  }

  // Сохранить (обновить) кроссворд
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
      // clues (если нужно), 
      // id: this.crosswordId (если нужно передавать id)
    };

    // Вызываем сервис для обновления
    this.crosswordsService.updateCrossword(this.crosswordId, crosswordData).subscribe({
      next: (response) => {
        console.log('Crossword successfully updated:', response);
        this.router.navigate(['/crosswords/library']);
      },
      error: (err) => {
        console.error('Error updating crossword:', err);
      },
    });
  }

  // Пример: берём определение из dictionary
  getWordDefinition(word: string): string {
    const found = this.dictionary.find((w) => w.word === word);
    return found ? found.definition : '';
  }

  getWordDirection(wordObj: SelectedWordObj): string {
    // Простейший способ
    if (wordObj.cells.length >= 2) {
      const [r1, c1] = [wordObj.cells[0].row, wordObj.cells[0].col];
      const [r2, c2] = [wordObj.cells[1].row, wordObj.cells[1].col];
      if (r1 === r2) return 'across';
    }
    return 'down';
  }
}
