import { Component, OnInit, ViewChild } from '@angular/core';
import { NotificationComponent } from '../../../../shared/notification/notification.component';
import { CrosswordsService } from '../../services/crosswords.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface Crossword {
  id: string;
  title: string;
}

@Component({
  selector: 'app-public-library',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationComponent],
  templateUrl: './public-library.component.html',
  styleUrls: ['./public-library.component.css'],
})
export class PublicLibraryComponent implements OnInit {
  @ViewChild(NotificationComponent) notification!: NotificationComponent;

  crosswords: Crossword[] = [];
  paginatedCrosswords: Crossword[][] = [];
  currentPage = 0;
  totalPages: number[] = [];
  userId: number = 0;

  constructor(
    private crosswordsService: CrosswordsService,
    private router: Router
  ) {}

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
        this.paginateCrosswords();
      },
      error: (error) => {
        console.error('Error fetching crosswords:', error);
      },
    });
  }

  createCrossword() {
    this.router.navigate(['/crosswords/crossword-params']);
  }

  addCrosswordToLibrary(crosswordId: string) {
    this.crosswordsService.addCrosswordToLibrary(crosswordId).subscribe({
      next: (response) => {
        console.log('Crossword added to library:', response);
        this.notification.show('Кроссворд добавлен в библиотеку!', 'success');
      },
      error: (error) => {
        console.error('Error adding crossword to library:', error);
        this.notification.show(
          'Ошибка при добавлении кроссворда в библиотеку.',
          'error'
        );
      },
    });
  }

  deleteCrosswordFromPublicLibrary(crosswordId: string) {
    this.crosswordsService
      .deleteCrosswordFromPublicLibrary(crosswordId)
      .subscribe({
        next: (response) => {
          console.log('Crossword deleted from public library:', response);
          this.fetchCrosswords();
          this.notification.show('Кроссворд удалён!', 'success');
        },
        error: (error) => {
          console.error('Error adding crossword to library:', error);
          this.notification.show('Ошибка при удалении кроссворда.', 'error');
        },
      });
  }

  editCrossword(crosswordId: string) {
    this.router.navigate([`/crosswords/edit?${crosswordId}`]);
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
