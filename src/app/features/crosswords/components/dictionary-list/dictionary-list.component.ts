import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DictionaryService } from '../../services/dictionaries.service';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from "../../../../shared/notification/notification.component";

@Component({
  selector: 'app-dictionary-list',
  standalone: true,
  imports: [CommonModule, NotificationComponent],
  templateUrl: './dictionary-list.component.html',
  styleUrl: './dictionary-list.component.css'
})
export class DictionaryListComponent implements OnInit {
  @ViewChild(NotificationComponent) notification!: NotificationComponent;
    dictionaries: any[] = [];
  
    constructor(private dictionaryService: DictionaryService, private router: Router) {}
  
    ngOnInit(): void {
      this.loadDictionaries();
    }
  
    loadDictionaries(): void {
      this.dictionaryService.getDictionaries().subscribe((data) => {
        this.dictionaries = data;
      });
    }
    
  
    deleteDictionary(id: number): void {
      this.dictionaryService.deleteDictionary(id).subscribe({ 
        next: (res) => {
          this.notification.show('Словарь удален успешно!', 'success');
          this.loadDictionaries();
        },
        error: (err) => {
          this.notification.show('Ошибка при удалении словаря!', 'error');
          console.error('Error deleting file', err);
        }
      });
    }
    
  
    navigateToUpload(): void {
      this.router.navigate(['crosswords/dictionaries']);
    }
  }
  