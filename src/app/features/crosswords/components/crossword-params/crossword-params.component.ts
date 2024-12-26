import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DictionaryService } from '../../services/dictionaries.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crossword-params',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crossword-params.component.html',
  styleUrl: './crossword-params.component.css',
})
export class CrosswordParamsComponent implements OnInit {
  formData = {
    title: '',
    width: 4,
    height: 4,
    hints: 0,
    dictionary: '',
    fillMethod: 'manual',
  };
  dictionaries: any = [];
  formErrors = {
    title: '',
    width: '',
    height: '',
    hints: '',
    dictionary: '',
    fillMethod: '',
  };

  constructor(
    private dictionaryService: DictionaryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDictionaries();
  }

  loadDictionaries(): void {
    this.dictionaryService.getDictionaries().subscribe((data) => {
      this.dictionaries = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/crosswords/library']);
  }

  validateForm(): boolean {
    let isValid = true;
    this.resetErrors();

    if (this.formData.title.length < 6 || this.formData.title.length > 30) {
      this.formErrors.title = 'Название должно быть от 6 до 30 символов';
      isValid = false;
    }
    if (this.formData.width < 4 || this.formData.width > 20) {
      this.formErrors.width = 'Ширина должна быть от 4 до 20 клеток';
      isValid = false;
    }
    if (this.formData.height < 4 || this.formData.height > 20) {
      this.formErrors.height = 'Высота должна быть от 4 до 20 клеток';
      isValid = false;
    }
    if (this.formData.hints < 0 || this.formData.hints > 10) {
      this.formErrors.hints = 'Количество подсказок должно быть от 0 до 10';
      isValid = false;
    }
    if (!this.formData.dictionary) {
      this.formErrors.dictionary = 'Выберите словарь';
      isValid = false;
    }
    if (!this.formData.fillMethod) {
      this.formErrors.fillMethod = 'Выберите способ заполнения';
      isValid = false;
    }

    return isValid;
  }

  resetErrors(): void {
    this.formErrors = {
      title: '',
      width: '',
      height: '',
      hints: '',
      dictionary: '',
      fillMethod: '',
    };
  }

  onSubmit(): void {
    if (this.validateForm()) {
      // Преобразуем formData в обычный объект
      const formData = {
        title: this.formData.title,
        width: this.formData.width,
        height: this.formData.height,
        hints: this.formData.hints,
        dictionary: this.formData.dictionary,
        fillMethod: this.formData.fillMethod,
      };

      if (this.formData.fillMethod === 'manual') {
        // Сохраняем данные в localStorage
        localStorage.setItem('crosswordFormData', JSON.stringify(formData));
        // Переходим на другую страницу
        this.router.navigate(['crosswords/crossword-create']);
      } else {
        // Преобразование formData в FormData
        const formData = new FormData();
        formData.append('title', this.formData.title);
        formData.append('width', this.formData.width.toString());
        formData.append('height', this.formData.height.toString());
        formData.append('hints', this.formData.hints.toString());
        formData.append('dictionary', this.formData.dictionary);
        formData.append('fillMethod', this.formData.fillMethod);

        // Отправка данных на сервер для автоматического заполнения
        this.dictionaryService
          .createCrossword(formData)
          .subscribe((response) => {
            this.router.navigate(['/crossword-list']);
          });
      }
    }
  }
}
