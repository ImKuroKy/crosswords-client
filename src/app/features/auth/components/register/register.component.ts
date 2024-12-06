import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  user = {
    nickname: '',
    password: '',
    confirmPassword: '',
  };

  constructor(private apiService: ApiService, private router: Router) {}

  onSubmit(form: NgForm) {
    if (form.valid && this.user.password === this.user.confirmPassword) {
      const { nickname, password } = this.user;
      const requestData = { nickname, password };
      this.apiService.register(requestData).subscribe({
        next: () => {
          this.router.navigate(['auth/login']);
        },
        error: (error) => {
          console.error('An error occurred during registration: ', error);
        },
      });
    } else {
      console.error('Form is invalid or passwords do not match');
    }
  }
}
