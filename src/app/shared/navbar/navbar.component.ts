import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CheckTokenService } from '../../services/check-token.service';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { IsAdminService } from '../../services/isAdmin.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  isAuthenticated = false;
  isAdmin = false;

  constructor(
    private checkTokenService: CheckTokenService,
    private isAdminService: IsAdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateUserState();
      });

    // Initial load
    this.updateUserState();
  }

  updateUserState(): void {
    this.checkTokenService.isAuthenticated.subscribe(
      (isAuthenticated) => (this.isAuthenticated = isAuthenticated)
    );
    if (this.isAuthenticated) {
      this.isAdminService.isAdmin().subscribe((isAdmin) => {
        this.isAdmin = isAdmin;
      });
    }
  }

  onLogout(): void {
    this.checkTokenService.logout();
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
