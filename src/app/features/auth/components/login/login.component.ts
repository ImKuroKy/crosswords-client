// src/app/pages/login-page/login-page.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { CheckTokenService } from '../../../../services/check-token.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  user = {
    nickname: '',
    password: '',
  };

  constructor(
    private apiService: ApiService,
    private checkTokenService: CheckTokenService,
    private router: Router
  ) {}

  onSubmit(form: NgForm) {
    if (form.invalid) return;

    this.apiService.login(this.user).subscribe({
      next: (response) => {
        this.router.navigate(['/crosswords/library']);
        this.checkTokenService.login();
        localStorage.setItem('token', response.token);

      },
      error: (error) => {
        console.error('There was an error logging in: ', error);
      },
    });
  }
}
