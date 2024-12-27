import { Injectable } from '@angular/core';

interface WordEntry {
  word: string;
  definition: string;
}

interface CrosswordCell {
  col: number;
  row: number;
  letter: string | null;
}

interface Clue {
  clue: string;
  cells: CrosswordCell[];
  number: number;
}

interface Crossword {
  grid: string[][];
  clues: {
      down: Clue[];
      across: Clue[];
  };
  hints: number;
  title: string;
  width: number;
  height: number;
  words: {
      col: number;
      row: number;
      word: string;
      cells: CrosswordCell[];
      length: number;
      direction: 'across' | 'down';
      definition: string;
  }[];
  dictionary: string;
  fillMethod: string;
}

@Injectable({
  providedIn: 'root',
})
export class CrosswordGeneratorService {

  constructor() { }

  private convertGrid(grid: (string | null)[][]): string[][] {
      return grid.map(row => row.map(cell => cell === null ? '' : cell));
  }

  private canPlaceWord(word: string, row: number, col: number, direction: 'across' | 'down', grid: (string | null)[][], height: number, width: number): boolean {
      const length = word.length;

      for (let i = 0; i < length; i++) {
          const r = direction === 'across' ? row : row + i;
          const c = direction === 'across' ? col + i : col;

          if (r >= height || c >= width || (grid[r][c] !== null && grid[r][c] !== word[i])) {
              return false;
          }

          // Check adjacent cells
          if (direction === 'across') {
              if ((c > 0 && grid[r][c - 1] !== null && grid[r][c - 1] !== word[i - 1]) ||
                  (c < width - 1 && grid[r][c + 1] !== null && grid[r][c + 1] !== word[i + 1])) {
                  return false;
              }
              if ((r > 0 && grid[r - 1][c] !== null) || (r < height - 1 && grid[r + 1][c] !== null)) {
                  return false;
              }
          } else {
              if ((r > 0 && grid[r - 1][c] !== null && grid[r - 1][c] !== word[i - 1]) ||
                  (r < height - 1 && grid[r + 1][c] !== null && grid[r + 1][c] !== word[i + 1])) {
                  return false;
              }
              if ((c > 0 && grid[r][c - 1] !== null) || (c < width - 1 && grid[r][c + 1] !== null)) {
                  return false;
              }
          }
      }

      return true;
  }

  private findIntersection(word: string, grid: (string | null)[][], height: number, width: number): { row: number, col: number, direction: 'across' | 'down' } | null {
      for (let row = 0; row < height; row++) {
          for (let col = 0; col < width; col++) {
              for (let i = 0; i < word.length; i++) {
                  const acrossStart = col - i;
                  if (acrossStart >= 0 && this.canPlaceWord(word, row, acrossStart, 'across', grid, height, width)) {
                      return { row, col: acrossStart, direction: 'across' };
                  }

                  const downStart = row - i;
                  if (downStart >= 0 && this.canPlaceWord(word, downStart, col, 'down', grid, height, width)) {
                      return { row: downStart, col, direction: 'down' };
                  }
              }
          }
      }
      return null;
  }

  private placeWord(word: string, row: number, col: number, direction: 'across' | 'down', grid: (string | null)[][], words: any[], clues: { down: Clue[], across: Clue[] }, wordNumber: number, dictionary: WordEntry[]) {
      const length = word.length;
      const cells: CrosswordCell[] = [];

      for (let i = 0; i < length; i++) {
          const r = direction === 'across' ? row : row + i;
          const c = direction === 'across' ? col + i : col;
          grid[r][c] = word[i];
          cells.push({ col: c, row: r, letter: word[i] });
      }

      words.push({
          col,
          row,
          word,
          cells,
          length,
          direction,
          definition: dictionary.find(entry => entry.word === word)!.definition
      });

      const clueList = clues[direction];
      clueList.push({
          clue: dictionary.find(entry => entry.word === word)!.definition,
          cells,
          number: wordNumber
      });
  }

  generateCrossword(width: number, height: number, dictionary: WordEntry[]): Crossword {
      const grid: (string | null)[][] = Array.from({ length: height }, () => Array(width).fill(null));

      const clues = {
          down: [] as Clue[],
          across: [] as Clue[]
      };

      const words = [] as {
          col: number;
          row: number;
          word: string;
          cells: CrosswordCell[];
          length: number;
          direction: 'across' | 'down';
          definition: string;
      }[];

      let wordNumber = 1;

      dictionary.sort((a, b) => b.word.length - a.word.length); // Sort words by length (longest first)

      for (const entry of dictionary) {
          const word = entry.word;

          const position = this.findIntersection(word, grid, height, width);

          if (position) {
              this.placeWord(word, position.row, position.col, position.direction, grid, words, clues, wordNumber++, dictionary);
          } else {
              console.log(`Unable to place word: ${word}`);
          }
      }

      return {
          grid: this.convertGrid(grid),
          clues,
          hints: 0,
          title: '',
          width,
          height,
          words,
          dictionary: '',
          fillMethod: 'manual'
      };
  }
}