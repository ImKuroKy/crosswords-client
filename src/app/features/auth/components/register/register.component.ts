import { Component, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../services/api.service';
import { NotificationComponent } from "../../../../shared/notification/notification.component";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NotificationComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  @ViewChild(NotificationComponent) notification!: NotificationComponent;
  user = {
    nickname: '',
    password: '',
    confirmPassword: '',
  };

  constructor(private apiService: ApiService, private router: Router) {}

  onSubmit(form: NgForm) {
    if (form.invalid) {
      this.notification.show(`Форма содержит ошибки. Проверьте корректность введенных данных!`, 'error');
      return;
    }
  
    if (this.user.password !== this.user.confirmPassword) {
      this.notification.show(`Пароли не совпадают!`, 'error');
      return;
    }
  
    const { nickname, password } = this.user;
    const requestData = { nickname, password };
  
    this.apiService.register(requestData).subscribe({
      next: () => {
        this.router.navigate(['auth/login']);
      },
      error: (error) => {
        this.notification.show(`Произошла ошибка при регистрации: ${error.error.message}`, 'error');
        console.error('Произошла ошибка при регистрации: ', error);
      },
    });
  }
  
}
