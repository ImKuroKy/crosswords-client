import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { CheckTokenService } from '../../../../services/check-token.service';
import { NotificationComponent } from '../../../../shared/notification/notification.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, NotificationComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  @ViewChild(NotificationComponent) notification!: NotificationComponent;

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
    if (form.invalid) {
      this.notification.show('Пожалуйста, заполните все поля корректно.', 'error');
      return;
    }

    this.apiService.login(this.user).subscribe({
      next: (response) => {
        this.router.navigate(['/crosswords/library']);
        this.checkTokenService.login();
        localStorage.setItem('token', response.token);
        this.notification.show('Вы успешно вошли!', 'success');
      },
      error: (error) => {
        this.notification.show(
          `Произошла ошибка при попытке авторизации: ${error.error}`,
          'error'
        );
        console.error('There was an error logging in: ', error);
      },
    });
  }
}
