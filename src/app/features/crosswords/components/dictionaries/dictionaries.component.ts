import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dictionaries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dictionaries.component.html',
  styleUrl: './dictionaries.component.css',
})
export class DictionariesComponent {
  file: File | null = null;
  private apiUrl = `${environment.apiUrl}/dictionaries`;

  constructor(private http: HttpClient) {}

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
    if (this.file) {
      const formData = new FormData();
      formData.append('file', this.file, this.file.name);

      this.http.post(this.apiUrl, formData).subscribe({
        next: (response) => {
          console.log('File uploaded successfully', response);
          alert('Файл загружен успешно!');
          this.file = null; // Сбросить выбранный файл после успешной загрузки
        },
        error: (error) => {
          console.error('Error uploading file', error);
          alert('Ошибка загрузки файла.');
        },
      });
    }
  }
}
