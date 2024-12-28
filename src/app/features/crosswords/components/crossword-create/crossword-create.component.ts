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
  // Сетка, куда пользователь проставляет слова
  grid: string[][] = [];

  // Массив всех слов в словаре
  dictionary: DictionaryWord[] = [];

  // Масcив «выделенных» участков, которые ещё не получили слово (или уже получили)
  selectedWords: SelectedWordObj[] = [];

  // При «drag&select» сохраняем координаты
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
    // Пробуем достать formData из localStorage
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

  // Создаём пустую сетку
  initializeGrid(): void {
    this.grid = Array.from({ length: this.formData.height }, () =>
      Array(this.formData.width).fill('')
    );
  }

  // Загрузить словарь
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

  // Начинаем выделение (mousedown)
  startSelection(row: number, col: number): void {
    // Удаляем из selectedWords объекты без выбранного слова (word === '')
    this.selectedWords = this.selectedWords.filter((w) => w.word !== '');
    this.selectedCells = [{ row, col }];
  }

  // Продолжаем выделение (mouseover)
  continueSelection(row: number, col: number): void {
    if (this.selectedCells.length) {
      this.selectedCells.push({ row, col });
    }
  }

  // Завершаем выделение (mouseup)
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

  /**
   * Отфильтровать и отсортировать слова для текущего выделения:
   *  1) По длине слова == длине выделенного отрезка
   *  2) Учитывать «маску» уже имеющихся букв (если в grid есть буквы)
   *  3) Исключать слова, которые уже выбраны в selectedWords
   *  4) Сортировать в алфавитном порядке (как пример)
   */
  filterWords(selectedCells: { row: number; col: number }[], wordObj?: SelectedWordObj): DictionaryWord[] {
    if (!Array.isArray(this.dictionary)) {
      console.error('Dictionary is not an array or undefined', this.dictionary);
      return [];
    }
  
    const wordLength = selectedCells.length;
    const usedWords = this.selectedWords.map((sw) => sw.word.toLowerCase());
  
    const validWords: DictionaryWord[] = this.dictionary.filter((dictItem) => {
      // 1) Длина
      if (dictItem.word.length !== wordLength) {
        return false;
      }
      // 2) Буквы совпадают с grid
      const isCompatible = selectedCells.every((cell, index) => {
        const gridLetter = this.grid[cell.row][cell.col];
        const dictLetter = dictItem.word[index];
        if (gridLetter) {
          return gridLetter.toLowerCase() === dictLetter.toLowerCase();
        }
        return true;
      });
      if (!isCompatible) return false;
  
      // 3) Не предлагать слова, уже выбранные в ДРУГИХ wordObj
      //    но если это именно "своё" слово, всё же оставляем
      if (
        usedWords.includes(dictItem.word.toLowerCase()) &&
        // если это не то же самое слово, которое уже выбрано в самом wordObj
        (wordObj?.word.toLowerCase() !== dictItem.word.toLowerCase())
      ) {
        return false;
      }
  
      return true;
    });
  
    // 4) Сортируем по алфавиту
    validWords.sort((a, b) => a.word.localeCompare(b.word, 'ru'));
  
    return validWords;
  }
  

  // Когда пользователь выбирает слово из <select>
  selectWord(event: Event, wordObj: SelectedWordObj) {
    const target = event.target as HTMLSelectElement;
    const selectedWord = target.value;
    wordObj.word = selectedWord;
  
    // Доп. валидация и заполнение сетки
    if (!this.validateNewWord(wordObj)) {
      // Если нельзя проставить
      wordObj.word = '';
      // Сбрасываем выбор (можно вернуть select на первое значение)
      target.value = '';
      return;
    }
  
    this.fillGrid(wordObj);
  }

  /**
   * Проверяем, можно ли разместить новое слово (wordObj) по текущим cells:
   *  1) Если это первое слово — разрешаем без проверок.
   *  2) Иначе должна быть хотя бы одна клетка, где пересекается с уже поставленными буквами 
   *     И при этом, если пересекается, буквы должны совпадать.
   *  3) Не должно быть конфликтов: если в клетке уже стоит другая буква, а новая буква отличается.
   *  (4) Можете дописать расширенную логику для «дефектных» слов / касаний и т. д.
   */
  validateNewWord(wordObj: SelectedWordObj): boolean {
    this.errorMessage = '';
    const { word, cells } = wordObj;

    // 1) Если это первое слово
    const usedWordsCount = this.selectedWords.filter((w) => w.word !== '').length - 1;
    // -1 потому что текущее словоObj мы ещё не считаем "ранее добавленным"

    if (usedWordsCount <= 0) {
      // Разрешаем первое слово без проверок
      return true;
    }

    let hasIntersection = false; // флаг, что есть корректное пересечение хотя бы в 1 клетке

    // Проходим по всем клеткам новой "выделенной" области
    for (let i = 0; i < cells.length; i++) {
      const { row, col } = cells[i];
      const newLetter = word[i]?.toLowerCase();
      const existingLetter = this.grid[row][col]?.toLowerCase();

      // 2) Если в клетке уже стоит буква
      if (existingLetter !== '') {
        if (existingLetter === newLetter) {
          // это корректное пересечение
          hasIntersection = true;
        } else {
          // конфликт: пытаемся поставить отличающуюся букву
          this.errorMessage = `Нельзя разместить слово "${word}" потому, что оно конфликтует с уже имеющимся словом (${row}, ${col}).`;
          return false;
        }
      }
    }

    // 3) Проверяем, что пересечение вообще есть. 
    if (!hasIntersection) {
      this.errorMessage = `Нельзя разместить слово "${word}" потому что оно не пересекается ни с одним из уже существующих слов.`;
      return false;
    }

    // 4) (Опционально) Дополнительная логика проверки «дефектных» слов 
    // (сложная задача, здесь можно проверить окружение).
    // Ниже — пример простого запрета на касание по диагонали, если хотите.
    // ... (опустить или реализовать по необходимости)

    return true;
  }

  // Заполняем сетку
  fillGrid(wordObj: SelectedWordObj): void {
    const { word, cells } = wordObj;
    cells.forEach((cell, index) => {
      this.grid[cell.row][cell.col] = word[index];
    });
  }

  // Клетка выделена?
  isSelectedCell(rowIndex: number, colIndex: number): boolean {
    return this.selectedCells.some(
      (cell) => cell.row === rowIndex && cell.col === colIndex
    );
  }

  // Сохраняем кроссворд
  saveCrossword(): void {
    // Формируем структуру
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

    // Отправляем данные на сервер
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
    // Стираем буквы из grid, которые не нужны другим словам
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
  
    // Убираем сам wordObj из массива (или просто обнуляем wordObj.word)
    const idx = this.selectedWords.indexOf(wordObj);
    if (idx !== -1) {
      this.selectedWords.splice(idx, 1);
    }
  }
  

  // Найти описание слова в словаре
  getWordDefinition(word: string): string {
    const wordObj = this.dictionary.find((w) => w.word === word);
    return wordObj ? wordObj.definition : '';
  }

  // Определить направление слова (горизонталь / вертикаль)
  getWordDirection(wordObj: SelectedWordObj): string {
    // Считаем, что если первая и вторая клетки в одном ряду, то across
    if (wordObj.cells.length >= 2) {
      const first = wordObj.cells[0];
      const second = wordObj.cells[1];
      if (first.row === second.row) return 'across';
    }
    return 'down';
  }

  // Генерим подсказки
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
      if (!wordObj.word) return; // пропускаем ещё не заполненные
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

  // Простейшее вычисление номера подсказки
  getClueNumber(wordObj: SelectedWordObj): number {
    return (
      wordObj.cells[0].row * this.formData.width + wordObj.cells[0].col + 1
    );
  }
}
