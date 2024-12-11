import { Component, OnInit, ViewChild } from '@angular/core';
import { NotificationComponent } from '../../../../shared/notification/notification.component';
import { CrosswordsService } from '../../services/crosswords.service';
import { CommonModule } from '@angular/common';

interface Crossword {
  id: string;
  title: string;
}
@Component({
  selector: 'app-user-library',
  standalone: true,
  imports: [CommonModule, NotificationComponent],
  templateUrl: './user-library.component.html',
  styleUrl: './user-library.component.css',
})
export class UserLibraryComponent implements OnInit {
  @ViewChild(NotificationComponent) notification!: NotificationComponent;

  crosswords: Crossword[] = [];
  paginatedCrosswords: Crossword[][] = [];
  currentPage = 0;
  totalPages: number[] = [];

  constructor(private crosswordsService: CrosswordsService) {}

  ngOnInit() {
    this.fetchCrosswords();
  }

  fetchCrosswords() {
    this.crosswordsService.getUserCrosswords().subscribe({
      next: (data: Crossword[]) => {
        this.crosswords = data;
      },
      error: (error) => {
        console.error('Error fetching crosswords:', error);
      },
    });
    this.paginateCrosswords();
  }

  deleteCrosswordFromLibrary(crosswordId: string) {
    this.crosswordsService.deleteCrosswordFromLibrary(crosswordId).subscribe({
      next: (response) => {
        console.log('Crossword deleted from library:', response);
        this.notification.show(
          'Crossword deleted from library successfully!',
          'success'
        );
      },
      error: (error) => {
        console.error('Error deleting crossword from library:', error);
        this.notification.show(
          'Error deleting crossword from library.',
          'error'
        );
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