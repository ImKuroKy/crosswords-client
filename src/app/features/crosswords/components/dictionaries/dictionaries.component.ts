import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { DictionaryService } from '../../services/dictionaries.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dictionaries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dictionaries.component.html',
  styleUrl: './dictionaries.component.css',
})
export class DictionariesComponent {
  file: File | null = null;
  dictionaryName: string = '';
  private apiUrl = `${environment.apiUrl}/dictionaries`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private dictionaryService: DictionaryService
  ) {}

  openFileChooser() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.file = event.dataTransfer.files[0];
    }
  }

  uploadFile() {
    if (this.file && this.dictionaryName) {
      const formData = new FormData();
      formData.append('file', this.file, this.file.name);
      formData.append('name', this.dictionaryName);

      this.dictionaryService.uploadDictionary(formData).subscribe({
        next: (response) => {
          console.log('File uploaded successfully', response);
          alert('Файл загружен успешно!');
          this.router.navigate(['/dictionaries']);
        },
        error: (error) => {
          console.error('Error uploading file', error);
          alert('Ошибка загрузки файла.');
        },
      });
    }
  }
}
