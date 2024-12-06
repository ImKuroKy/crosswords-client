import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CheckTokenService } from '../../services/check-token.service.js';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  isAuthenticated = false;

  constructor(private checkTokenService: CheckTokenService) {}

  ngOnInit(): void {
    this.checkTokenService.isAuthenticated.subscribe(
      (isAuthenticated) => (this.isAuthenticated = isAuthenticated)
    );
  }
}
