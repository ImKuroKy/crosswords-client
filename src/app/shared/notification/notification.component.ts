import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit {
  isVisible = false;
  message = '';
  type: 'success' | 'error' = 'success';

  constructor() {}

  ngOnInit(): void {}

  show(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.type = type;
    this.isVisible = true;
    setTimeout(() => this.hide(), 3000);
  }

  hide(): void {
    this.isVisible = false;
  }
}