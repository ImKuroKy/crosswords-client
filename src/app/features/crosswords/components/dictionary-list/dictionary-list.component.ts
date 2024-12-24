import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DictionaryService } from '../../services/dictionaries.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dictionary-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dictionary-list.component.html',
  styleUrl: './dictionary-list.component.css'
})
export class DictionaryListComponent implements OnInit {
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
      this.dictionaryService.deleteDictionary(id).subscribe(() => {
        this.loadDictionaries();
      });
    }
    
  
    navigateToUpload(): void {
      this.router.navigate(['crosswords/dictionaries']);
    }
  }
  