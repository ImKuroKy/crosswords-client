import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/components/login/login.component';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { PublicLibraryComponent } from './features/crosswords/components/public-library/public-library.component';
import { UserLibraryComponent } from './features/crosswords/components/user-library/user-library.component';
import { DictionariesComponent } from './features/crosswords/components/dictionaries/dictionaries.component';
import { DictionaryListComponent } from './features/crosswords/components/dictionary-list/dictionary-list.component';

export const routes: Routes = [
  {
    title: 'Вход в систему',
    path: 'auth/login',
    component: LoginComponent,
  },
  {
    title: 'Регистрация',
    path: 'auth/register',
    component: RegisterComponent,
  },
  {
    title: 'Все кроссворды',
    path: 'crosswords/library',
    component: PublicLibraryComponent,
  },
  {
    title: 'Ваши кроссворды',
    path: 'crosswords/user/library',
    component: UserLibraryComponent,
  },
  {
    title: 'Добавить словарь',
    path: 'crosswords/dictionaries',
    component: DictionariesComponent,
  },
  {
    title: 'Все словари',
    path: 'crosswords/dictionary-list',
    component: DictionaryListComponent,
  },
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth/login' }, // Redirect unknown routes to login
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
