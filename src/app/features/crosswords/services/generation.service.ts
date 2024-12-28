import { Injectable } from '@angular/core';

interface DictionaryEntry {
  word: string;
  definition: string;
}

/**
 * Описание размещённого слова в кроссворде.
 */
interface CrosswordWord {
  word: string;
  definition: string;
  row: number;
  col: number;
  length: number;
  direction: 'across' | 'down';
  cells: { row: number; col: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class CrosswordGeneratorService {
  /**
   * Генерация "классического" кроссворда, избегающего побочных слов.
   */
  generateCrossword(
    width: number,
    height: number,
    dictionary: DictionaryEntry[]
  ): {
    grid: string[][];
    words: CrosswordWord[];
    clues: {
      across: Array<{
        clue: string;
        cells: { row: number; col: number }[];
        number: number;
      }>;
      down: Array<{
        clue: string;
        cells: { row: number; col: number }[];
        number: number;
      }>;
    };
  } {
    // Создаём пустую сетку
    const grid: string[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => '')
    );

    // Список уже размещённых слов
    const placedWords: CrosswordWord[] = [];

    // Преобразуем все слова к нижнему регистру (чтобы не путать буквы)
    // Или можно оставить как есть — решать вам.
    const entries = dictionary.map((e) => ({
      word: e.word.toLowerCase(),
      definition: e.definition,
    }));

    // 1) Берём первое слово (лучше всего — самое длинное; здесь упрощённо — просто первое по списку)
    if (entries.length === 0) {
      return { grid, words: [], clues: { across: [], down: [] } };
    }

    // Возьмём первое слово и попытаемся разместить его горизонтально в центре
    const firstEntry = entries[0];
    const firstWord = firstEntry.word;
    const firstDefinition = firstEntry.definition;

    // Простейшая проверка: если слово длиннее ширины, придётся разместить вертикально (или сделать проверку, что оно влезает)
    let direction: 'across' | 'down' = 'across';
    if (firstWord.length > width) {
      // Пробуем поставить его вертикально
      direction = 'down';
      if (firstWord.length > height) {
        // Слово вообще не влезает...
        // Возвращаем пустой результат
        return { grid, words: [], clues: { across: [], down: [] } };
      }
    }

    // Координаты "центра" (примерный)
    const midRow = Math.floor(height / 2);
    const midCol = Math.floor(width / 2);

    // Вычислим старт так, чтобы слово целиком вошло
    let startRow = midRow;
    let startCol = midCol;

    if (direction === 'across') {
      startCol = Math.max(0, midCol - Math.floor(firstWord.length / 2));
    } else {
      startRow = Math.max(0, midRow - Math.floor(firstWord.length / 2));
    }

    // Размещаем первое слово
    this.placeWordInGrid(
      grid,
      startRow,
      startCol,
      firstWord,
      direction
    );

    const cells = this.computeCells(startRow, startCol, firstWord.length, direction);
    placedWords.push({
      word: firstWord,
      definition: firstDefinition,
      row: startRow,
      col: startCol,
      length: firstWord.length,
      direction,
      cells,
    });

    // 2) Размещаем все последующие слова
    for (let i = 1; i < entries.length; i++) {
      const { word, definition } = entries[i];
      // Проверяем, не уже ли размещено (допустим, кто-то добавил дубли)
      if (placedWords.some((w) => w.word === word)) {
        continue; // Пропускаем дубликат
      }

      // Пытаемся разместить, перебирая все возможные пересечения с уже размещёнными словами
      let placed = false;

      outerLoop: for (const existing of placedWords) {
        // Перебираем буквы нового слова
        for (let newWordIndex = 0; newWordIndex < word.length; newWordIndex++) {
          const newChar = word[newWordIndex];

          // Перебираем буквы уже размещённого слова
          for (let existingIndex = 0; existingIndex < existing.word.length; existingIndex++) {
            const existingChar = existing.word[existingIndex];

            // Ищем совпадение букв
            if (newChar === existingChar) {
              // Предположим, что хотим пересечься в этих двух буквах
              // Если existing.direction === 'across', значит existingChar лежит на [existing.row, existing.col + existingIndex]
              // Если 'down', то на [existing.row + existingIndex, existing.col]

              const existingRow =
                existing.direction === 'across'
                  ? existing.row
                  : existing.row + existingIndex;
              const existingCol =
                existing.direction === 'across'
                  ? existing.col + existingIndex
                  : existing.col;

              // Теперь в зависимости от того, куда мы хотим поставить новое слово, 
              // мы можем «вертикально» или «горизонтально» расположить его
              // Чтобы пересечься по букве newWordIndex
              // Если мы ориентируем слово "across", значит совпавшая буква должна лежать на [existingRow, existingCol], 
              // но смещённая на -newWordIndex по колонки
              // row = existingRow
              // col = existingCol - newWordIndex
              // При этом проверяем, не выходит ли за границы, не создаём ли побочные слова и т.п.

              // Попробуем "across" вариант
              const acrossStartCol = existingCol - newWordIndex;
              const acrossStartRow = existingRow;
              if (
                this.canPlaceWordNoSideWords(
                  grid,
                  word,
                  acrossStartRow,
                  acrossStartCol,
                  'across',
                  newWordIndex
                )
              ) {
                // Размещаем
                this.placeWordInGrid(grid, acrossStartRow, acrossStartCol, word, 'across');
                const newCells = this.computeCells(
                  acrossStartRow,
                  acrossStartCol,
                  word.length,
                  'across'
                );
                placedWords.push({
                  word,
                  definition,
                  row: acrossStartRow,
                  col: acrossStartCol,
                  length: word.length,
                  direction: 'across',
                  cells: newCells,
                });
                placed = true;
                break outerLoop;
              }

              // Попробуем "down" вариант
              const downStartRow = existingRow - newWordIndex;
              const downStartCol = existingCol;
              if (
                this.canPlaceWordNoSideWords(
                  grid,
                  word,
                  downStartRow,
                  downStartCol,
                  'down',
                  newWordIndex
                )
              ) {
                // Размещаем
                this.placeWordInGrid(grid, downStartRow, downStartCol, word, 'down');
                const newCells = this.computeCells(
                  downStartRow,
                  downStartCol,
                  word.length,
                  'down'
                );
                placedWords.push({
                  word,
                  definition,
                  row: downStartRow,
                  col: downStartCol,
                  length: word.length,
                  direction: 'down',
                  cells: newCells,
                });
                placed = true;
                break outerLoop;
              }
            }
          }
        }
      }
    }

    // Формируем подсказки (упрощённая логика)
    const clues = this.buildClues(placedWords);

    return {
      grid,
      words: placedWords,
      clues,
    };
  }

  /**
   * Реально "прописываем" слово в сетку (grid) по заданным координатам и направлению.
   */
  private placeWordInGrid(
    grid: string[][],
    startRow: number,
    startCol: number,
    word: string,
    direction: 'across' | 'down'
  ): void {
    if (direction === 'across') {
      for (let i = 0; i < word.length; i++) {
        grid[startRow][startCol + i] = word[i];
      }
    } else {
      for (let i = 0; i < word.length; i++) {
        grid[startRow + i][startCol] = word[i];
      }
    }
  }

  /**
   * Возвращает массив координат [row,col] для слова заданной длины, начиная от (startRow, startCol) в направлении dir.
   */
  private computeCells(
    startRow: number,
    startCol: number,
    length: number,
    direction: 'across' | 'down'
  ): { row: number; col: number }[] {
    const cells = [];
    for (let i = 0; i < length; i++) {
      const r = direction === 'down' ? startRow + i : startRow;
      const c = direction === 'across' ? startCol + i : startCol;
      cells.push({ row: r, col: c });
    }
    return cells;
  }

  /**
   * Проверяем, можно ли разместить слово word в позиции (startRow, startCol) c направлением dir,
   * учитывая, что пересечение происходит на индексе intersectIndex (букве).
   * Важное: Проверяем отсутствие побочных слов!
   */
  private canPlaceWordNoSideWords(
    grid: string[][],
    word: string,
    startRow: number,
    startCol: number,
    dir: 'across' | 'down',
    intersectIndex: number
  ): boolean {
    const height = grid.length;
    const width = grid[0].length;

    // Проверяем границы
    if (dir === 'across') {
      if (startCol < 0 || startCol + word.length > width) {
        return false;
      }
      // row тоже не должен быть за границей
      if (startRow < 0 || startRow >= height) {
        return false;
      }
    } else {
      if (startRow < 0 || startRow + word.length > height) {
        return false;
      }
      // col тоже не должен выходить за границы
      if (startCol < 0 || startCol >= width) {
        return false;
      }
    }

    // Проверяем каждую букву
    for (let i = 0; i < word.length; i++) {
      const r = dir === 'down' ? startRow + i : startRow;
      const c = dir === 'across' ? startCol + i : startCol;

      // Если в клетке уже есть буква, и она не совпадает с новой — нельзя
      if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
        return false;
      }

      // + проверяем «побочные» клетки (слева/справа или сверху/снизу), чтобы не создавать лишние слова
      // Исключаем ту клетку, где реальное пересечение (i = intersectIndex), там у нас другая логика
      // Но если там есть буква, она должна совпадать.
      if (dir === 'across') {
        // Проверяем верх/низ, если есть буквы — значит потенциально создаём побочное слово
        // Разрешаем букву только в случае, когда i=intersectIndex, но тогда это уже должно быть то самое пересечение
        if (this.hasLetter(grid, r - 1, c) || this.hasLetter(grid, r + 1, c)) {
          // Если i != intersectIndex — значит это побочное слово
          // Если i == intersectIndex и там есть буквы, мы должны проверить, что это часть пересечения.
          // Но упрощённо запретим вообще, кроме пустоты
          if (i !== intersectIndex) {
            return false;
          }
        }
      } else {
        // dir === 'down'
        // Проверяем слева/справа
        if (this.hasLetter(grid, r, c - 1) || this.hasLetter(grid, r, c + 1)) {
          if (i !== intersectIndex) {
            return false;
          }
        }
      }
    }

    // Дополнительно проверим «пустую» клетку до и после слова,
    // чтобы не соединяться «впритык» с другими словами
    if (dir === 'across') {
      // Клетка слева от startCol
      if (this.hasLetter(grid, startRow, startCol - 1)) {
        return false;
      }
      // Клетка справа от endCol
      const endCol = startCol + word.length - 1;
      if (this.hasLetter(grid, startRow, endCol + 1)) {
        return false;
      }
    } else {
      // dir === 'down'
      if (this.hasLetter(grid, startRow - 1, startCol)) {
        return false;
      }
      const endRow = startRow + word.length - 1;
      if (this.hasLetter(grid, endRow + 1, startCol)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Вспомогательный метод: true, если в (r,c) в пределах сетки есть буква (не пустая).
   */
  private hasLetter(grid: string[][], r: number, c: number): boolean {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) {
      return false;
    }
    return grid[r][c] !== '';
  }

  /**
   * Формируем объект с классическими "подсказками" (clues).
   * Упрощённо: просто группируем по direction и даём им фиктивные номера.
   */
  private buildClues(placedWords: CrosswordWord[]) {
    const acrossWords = placedWords.filter((w) => w.direction === 'across');
    const downWords = placedWords.filter((w) => w.direction === 'down');

    // Условно нумеруем по порядку
    const clues = {
      across: acrossWords.map((w, idx) => ({
        clue: w.definition,
        cells: w.cells,
        number: 100 + idx,
      })),
      down: downWords.map((w, idx) => ({
        clue: w.definition,
        cells: w.cells,
        number: 200 + idx,
      })),
    };

    return clues;
  }
}
