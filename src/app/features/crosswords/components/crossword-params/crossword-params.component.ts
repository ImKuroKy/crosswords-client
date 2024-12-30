import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DictionaryService } from '../../services/dictionaries.service';
import { Router } from '@angular/router';
import { CrosswordGeneratorService } from '../../services/generation.service';
import { CrosswordsService } from '../../services/crosswords.service';
import { NotificationComponent } from "../../../../shared/notification/notification.component";

@Component({
  selector: 'app-crossword-params',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationComponent],
  templateUrl: './crossword-params.component.html',
  styleUrl: './crossword-params.component.css',
})
export class CrosswordParamsComponent implements OnInit {
  @ViewChild(NotificationComponent) notification!: NotificationComponent;
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
    private crosswordsService: CrosswordsService,
    private router: Router,
    private crosswordGeneratorService: CrosswordGeneratorService
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
      const formData = {
        title: this.formData.title,
        width: this.formData.width,
        height: this.formData.height,
        hints: this.formData.hints,
        dictionary: this.formData.dictionary,
        fillMethod: this.formData.fillMethod,
      };

      if (this.formData.fillMethod === 'manual') {
        // Добавить запрос на поиск кроссворда с тем же именем на сервере
        //
        //
        localStorage.setItem('crosswordFormData', JSON.stringify(formData));
        this.router.navigate(['crosswords/crossword-create']);
      } else {
        this.dictionaryService
          .getDictionaryByName(this.formData.dictionary)
          .subscribe({
            next: (data) => {
              try {
                const parsedContent = JSON.parse(data.content);
                const dictionary = parsedContent.words || [];

                const crossword =
                  this.crosswordGeneratorService.generateCrossword(
                    this.formData.width,
                    this.formData.height,
                    dictionary
                  );

                const crosswordData = {
                  title: this.formData.title,
                  width: this.formData.width,
                  height: this.formData.height,
                  hints: this.formData.hints,
                  fillMethod: this.formData.fillMethod,
                  dictionary: this.formData.dictionary,
                  grid: crossword.grid,
                  words: crossword.words,
                  clues: crossword.clues,
                };

                console.log(crosswordData);
                this.crosswordsService.saveCrossword(crosswordData).subscribe({
                  next: () => {
                    this.notification.show('Кроссворд создан успешно!', 'success');
                    setTimeout(() => {
                      this.router.navigate(['/crosswords/library']);
                    }, 3000);
                  },
                  error: (error) => {
                    this.notification.show(`Ошибка при создании кроссворда: ${error.error.message}`, 'error');
                    console.error('Error saving crossword:', error);
                  },
                });
              } catch (error) {
                this.formErrors.dictionary = 'Ошибка при обработке словаря';
                console.error('Error parsing dictionary content:', error);
              }
            },
            error: (error) => {
              this.formErrors.dictionary = 'Ошибка при загрузке словаря';
              console.error('Error loading dictionary:', error);
            },
          });
      }
    }
  }
}
