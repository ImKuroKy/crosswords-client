import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrosswordsService } from '../../services/crosswords.service';

// ================== Интерфейсы ================== //
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
  // Прочие поля, если нужно...
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
  crosswordData: CrosswordData | null = null;
  // userInputs: объект, где ключ — "row-col", значение — введённая буква
  userInputs: Record<string, string> = {};
  // Храним уже "решённые" слова (по самому слову — или по уникальному ID)
  solvedWords: Set<string> = new Set();
  isGameCompleted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private crosswordsService: CrosswordsService
  ) {}

  ngOnInit(): void {
    this.crosswordId = this.route.snapshot.paramMap.get('crosswordId') || '';
    this.fetchCrosswordData();
  }

  fetchCrosswordData(): void {
    this.crosswordsService.getCrosswordById(this.crosswordId).subscribe({
      next: (data: any) => {
        // Предположим, что нужные данные приходят так:
        this.crosswordData = data.crossword.content;
        // Инициализируем пустые вводы
        this.initializeUserInputs();
      },
      error: (err) => {
        console.error('Error fetching crossword data', err);
      },
    });
  }

  // Для каждой ячейки, которая участвует в словах, заводим userInputs с пустой строкой
  initializeUserInputs(): void {
    if (!this.crosswordData) return;

    this.crosswordData.words.forEach((word) => {
      word.cells.forEach((cell) => {
        const key = `${cell.row}-${cell.col}`;
        // Изначально пустая строка; 
        // Если хотим подсвечивать уже «заполненные» буквы — можно поставить их сразу.
        if (!this.userInputs[key]) {
          this.userInputs[key] = '';
        }
      });
    });
  }

  // При изменении в <input>
  onInputChange(row: number, col: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.trim().toLowerCase();
    this.userInputs[`${row}-${col}`] = newValue;

    // Проверяем, решены ли слова, которые затрагивают данную клетку
    if (!this.crosswordData) return;
    this.crosswordData.words.forEach((word) => {
      // Проверяем, принадлежит ли клетка этому слову
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

    // Проверка окончания игры
    this.checkGameCompletion();
  }

  // Проверяем, совпадают ли все буквы для данного слова
  checkWordSolved(word: Word): boolean {
    if (!this.crosswordData) return false;
    for (const cell of word.cells) {
      const userLetter = (this.userInputs[`${cell.row}-${cell.col}`] || '').trim().toLowerCase();
      const originalLetter = (this.crosswordData.grid[cell.row][cell.col] || '')
        .trim()
        .toLowerCase();
      if (userLetter !== originalLetter || !userLetter) {
        return false;
      }
    }
    return true;
  }

  // Для зачёркивания подсказок
  isWordSolved(clue: Clue): boolean {
    if (!this.crosswordData) return false;
    // Находим слово (Word) по клеткам из clue
    const word = this.crosswordData.words.find((w) =>
      w.cells.every((cell) =>
        clue.cells.some((clueCell) => 
          clueCell.row === cell.row && clueCell.col === cell.col
        )
      )
    );
    if (!word) return false;
    return this.checkWordSolved(word);
  }

  checkGameCompletion(): void {
    if (!this.crosswordData) return;
    const allClues = [...this.crosswordData.clues.across, ...this.crosswordData.clues.down];
    // Если все подсказки решены
    this.isGameCompleted = allClues.every((clue) => this.isWordSolved(clue));
    if (this.isGameCompleted) {
      console.log('Game completed!');
      // Перенаправление через 10 секунд (по желанию)
      setTimeout(() => {
        this.router.navigate(['/crosswords/user/library']);
      }, 10000);
    }
  }

  saveCrossword(): void {
    // Здесь можно вызвать сервис, передать userInputs и т.д.
    console.log('Saving crossword with user inputs:', this.userInputs);
  }
}
