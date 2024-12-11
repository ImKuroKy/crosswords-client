import { Component, OnInit } from '@angular/core';
import { CrosswordsService } from '../../services/crosswords.service'; // Обновите путь в соответствии с вашим проектом
import { CommonModule } from '@angular/common';

interface Crossword {
  id: string;
  title: string;
}
@Component({
  selector: 'app-public-library',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-library.component.html',
  styleUrl: './public-library.component.css',
})
export class PublicLibraryComponent implements OnInit {
  crosswords: Crossword[] = [];
  paginatedCrosswords: Crossword[][] = [];
  currentPage = 0;
  totalPages: number[] = [];
  userId: number = 0;

  constructor(private crosswordsService: CrosswordsService) {}

  ngOnInit() {
    this.fetchUserId();
    this.fetchCrosswords();
  }

  fetchUserId(): void {
    this.crosswordsService.getUserId().subscribe((response) => {
      this.userId = response.userId;
    });
  }

  fetchCrosswords() {
    this.crosswordsService.getCrosswords().subscribe({
      next: (data: Crossword[]) => {
        this.crosswords = data;
      },
      error: (error) => {
        console.error('Error fetching crosswords:', error);
      },
    });
    this.paginateCrosswords();
  }

  addCrosswordToLibrary(crosswordId: string) {
    this.crosswordsService.addCrosswordToLibrary(crosswordId).subscribe({
      next: (response) => {
        console.log('Crossword added to library:', response);
        // Здесь можно добавить логику для уведомления пользователя о успешном добавлении
      },
      error: (error) => {
        console.error('Error adding crossword to library:', error);
        // Здесь можно добавить логику для уведомления пользователя о ошибке
      },
    });
  }

  paginateCrosswords(): void {
    const pageSize = 12;
    this.paginatedCrosswords = [];
    for (let i = 0; i < this.crosswords.length; i += pageSize) {
      this.paginatedCrosswords.push(this.crosswords.slice(i, i + pageSize));
    }
    this.totalPages = Array(this.paginatedCrosswords.length)
      .fill(0)
      .map((x, i) => i);
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }
}
