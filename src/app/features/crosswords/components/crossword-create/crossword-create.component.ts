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

interface DictionaryWord {
  word: string;
  definition: string;
}

interface SelectedWordObj {
  length: number;
  cells: { row: number; col: number }[];
  word: string; // заполняется после выбора
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
  grid: string[][] = [];
  dictionary: DictionaryWord[] = [];
  selectedWords: SelectedWordObj[] = [];

  selectedCells: { row: number; col: number }[] = [];
  errorMessage = '';

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
    console.log('Dictionary name before service call:', this.formData.dictionary);
    this.dictionaryService
      .getDictionaryByName(this.formData.dictionary)
      .subscribe({
        next: (data) => {
          console.log('Dictionary loaded:', data);
          try {
            const parsedContent = JSON.parse(data.content);
            this.dictionary = parsedContent.words || [];
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
    this.selectedWords = this.selectedWords.filter((w) => w.word !== '');
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

  filterWords(
    selectedCells: { row: number; col: number }[],
    wordObj?: SelectedWordObj
  ): DictionaryWord[] {
    if (!Array.isArray(this.dictionary)) {
      console.error('Dictionary is not an array or undefined', this.dictionary);
      return [];
    }

    const wordLength = selectedCells.length;
    const usedWords = this.selectedWords.map((sw) => sw.word.toLowerCase());

    const validWords: DictionaryWord[] = this.dictionary.filter((dictItem) => {
      if (dictItem.word.length !== wordLength) return false;

      const isCompatible = selectedCells.every((cell, index) => {
        const gridLetter = this.grid[cell.row][cell.col];
        const dictLetter = dictItem.word[index];
        if (gridLetter) {
          return gridLetter.toLowerCase() === dictLetter.toLowerCase();
        }
        return true;
      });
      if (!isCompatible) return false;

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

  selectWord(event: Event, wordObj: SelectedWordObj) {
    const target = event.target as HTMLSelectElement;
    const selectedWord = target.value;
    wordObj.word = selectedWord;

    if (!this.validateNewWord(wordObj)) {
      wordObj.word = '';
      target.value = '';
      return;
    }
    this.fillGrid(wordObj);
  }

  /**
   * Доп. метод, чтобы узнать, с какими СТАРЫМИ словами мы реально пересекаемся.
   * "Реально пересекаемся" = есть хотя бы одна общая клетка (row,col) + совпадающие буквы.
   */
  private getIntersectingWords(newWordObj: SelectedWordObj): SelectedWordObj[] {
    const intersecting: SelectedWordObj[] = [];

    // Пробегаем уже "проставленные" слова:
    const oldWords = this.selectedWords.filter((w) => w.word !== '' && w !== newWordObj);
    // Для каждого проверяем: есть ли общий (row,col) с одинаковой буквой
    for (const oldW of oldWords) {
      let hasIntersection = false;
      for (let i = 0; i < newWordObj.cells.length; i++) {
        const { row, col } = newWordObj.cells[i];
        const newLetter = (newWordObj.word[i] || '').toLowerCase();

        // Проверяем, не входит ли (row, col) в oldW
        const oldIndex = oldW.cells.findIndex(
          (c, idx) => c.row === row && c.col === col
        );
        if (oldIndex !== -1) {
          // старое слово тоже использует эту клетку
          const oldLetter = (oldW.word[oldIndex] || '').toLowerCase();
          if (oldLetter === newLetter && newLetter !== '') {
            hasIntersection = true;
            break;
          }
        }
      }
      if (hasIntersection) {
        intersecting.push(oldW);
      }
    }
    return intersecting;
  }

  validateNewWord(wordObj: SelectedWordObj): boolean {
    this.errorMessage = '';
    const { word, cells } = wordObj;

    // 1) Сколько уже "проставленных" слов?
    const usedWordsCount = this.selectedWords.filter((w) => w.word !== '').length - 1;
    if (usedWordsCount < 0) {
      // первое слово
      return true;
    }

    // Ищем, есть ли хотя бы одна реальная клетка пересечения
    let hasIntersection = false;

    // Список слов, с которыми есть реальное пересечение
    // (т. е. хотя бы одна клетка общая по координатам и буквам)
    const intersectingWords = this.getIntersectingWords(wordObj);

    // Если intersectingWords не пуст, значит в принципе пересечение есть
    // (но нужно проверить еще каждую клетку, нет ли конфликтов)
    // А если пуст, но у нас не первое слово => ошибка
    if (usedWordsCount >= 1 && intersectingWords.length === 0) {
      this.errorMessage = `Нельзя разместить слово "${word}" — не пересекается ни с одним из уже существующих.`;
      return false;
    }

    // neighbors - только 4 стороны, без диагоналей
    const neighbors = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
    ];

    for (let i = 0; i < cells.length; i++) {
      const { row, col } = cells[i];
      const newLetter = (word[i] || '').toLowerCase();
      const existingLetter = (this.grid[row][col] || '').toLowerCase();

      // A) Конфликт букв?
      if (existingLetter !== '') {
        if (existingLetter !== newLetter) {
          this.errorMessage = `Нельзя разместить "${word}" - конфликт в клетке (${row},${col}).`;
          return false;
        } else {
          // они совпадают => реальное пересечение
          hasIntersection = true;
        }
      }

      // B) Проверка соседей
      for (const nb of neighbors) {
        const rr = row + nb.dr;
        const cc = col + nb.dc;
        if (
          rr < 0 ||
          rr >= this.formData.height ||
          cc < 0 ||
          cc >= this.formData.width
        ) {
          continue;
        }

        // Является ли (rr, cc) частью текущего нового слова?
        const isInThisNewWord = cells.some((c) => c.row === rr && c.col === cc);
        if (!isInThisNewWord) {
          const neighborLetter = (this.grid[rr][cc] || '').toLowerCase();
          if (neighborLetter !== '') {
            // Значит там буква другого слова. 
            // Разрешим это только если (rr, cc) принадлежит одному из intersectingWords:
            const isFromIntersecting = this.belongsToIntersectingWord(rr, cc, intersectingWords);

            // Если (rr, cc) не принадлежит "пересекающемуся" слову,
            // значит это "какой-то другой" уже проставленный кусок => запрещаем касание.
            if (!isFromIntersecting) {
              this.errorMessage = `Нельзя поставить "${word}" рядом с чужой буквой '${neighborLetter}' в клетке (${rr},${cc}).`;
              return false;
            }
          }
        }
      }
    }

    // Если у нас больше 0 старых слов, но не встретили ни одной клетки совпадения
    // (Вдруг newLetter было пустое? Теоретически нет, но на всякий случай)
    if (usedWordsCount >= 1 && !hasIntersection) {
      this.errorMessage = `Нельзя разместить слово "${word}" — не пересекается буквами с уже существующими словами.`;
      return false;
    }

    return true;
  }

  /**
   * Метод, чтобы понять, принадлежит ли клетка (rr, cc) хоть одному "пересекающемуся" слову.
   * "Пересекающееся слово" - такое, где есть реальное пересечение по координатам и буквам 
   * с новым словом (см. getIntersectingWords).
   */
  private belongsToIntersectingWord(rr: number, cc: number, intersectingWords: SelectedWordObj[]): boolean {
    for (const oldW of intersectingWords) {
      // Принадлежит ли клетка (rr, cc) этому слову?
      const idx = oldW.cells.findIndex((c) => c.row === rr && c.col === cc);
      if (idx !== -1) {
        // Да, клетка (rr, cc) тоже занимает этот oldW
        // => значит мы "касаемся" букв того слова, с которым уже есть реальное пересечение
        return true;
      }
    }
    return false;
  }

  fillGrid(wordObj: SelectedWordObj): void {
    const { word, cells } = wordObj;
    cells.forEach((cell, index) => {
      this.grid[cell.row][cell.col] = word[index];
    });
  }

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

    this.crosswordsService.saveCrossword(crosswordData).subscribe({
      next: (response) => {
        console.log('Кроссворд успешно сохранен:', response);
        this.router.navigate(['/crosswords/library']);
      },
      error: (error) => {
        console.error('Ошибка при сохранении кроссворда:', error);
      },
      complete: () => {
        console.log('Процесс сохранения завершен');
      },
    });
  }

  removeSelectedWord(wordObj: SelectedWordObj) {
    for (const cell of wordObj.cells) {
      const { row, col } = cell;
      const usedByAnother = this.selectedWords.some((w) => {
        if (w === wordObj || w.word === '') {
          return false;
        }
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

  getWordDefinition(word: string): string {
    const wordObj = this.dictionary.find((w) => w.word === word);
    return wordObj ? wordObj.definition : '';
  }

  getWordDirection(wordObj: SelectedWordObj): string {
    if (wordObj.cells.length >= 2) {
      const first = wordObj.cells[0];
      const second = wordObj.cells[1];
      if (first.row === second.row) return 'across';
    }
    return 'down';
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
      if (!wordObj.word) return;
      const clueItem = {
        number: this.getClueNumber(wordObj),
        clue: this.getWordDefinition(wordObj.word),
        cells: wordObj.cells,
      };
      if (this.getWordDirection(wordObj) === 'across') {
        across.push(clueItem);
      } else {
        down.push(clueItem);
      }
    });
    return { across, down };
  }

  getClueNumber(wordObj: SelectedWordObj): number {
    return wordObj.cells[0].row * this.formData.width + wordObj.cells[0].col + 1;
  }
}
