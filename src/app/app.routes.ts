import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/components/login/login.component';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { PublicLibraryComponent } from './features/crosswords/components/public-library/public-library.component';
import { UserLibraryComponent } from './features/crosswords/components/user-library/user-library.component';
import { DictionariesComponent } from './features/crosswords/components/dictionaries/dictionaries.component';
import { DictionaryListComponent } from './features/crosswords/components/dictionary-list/dictionary-list.component';
import { DevelopersComponent } from './features/about/components/developers/developers.component';
import { SystemComponent } from './features/about/components/system/system.component';
import { CrosswordParamsComponent } from './features/crosswords/components/crossword-params/crossword-params.component';
import { CrosswordCreateComponent } from './features/crosswords/components/crossword-create/crossword-create.component';

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
    title: 'Параметры кроссворда',
    path: 'crosswords/crossword-params',
    component: CrosswordParamsComponent,
  },
  {
    title: 'Создание кроссворда',
    path: 'crosswords/crossword-create',
    component: CrosswordCreateComponent,
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
  {
    title: 'О разработчиках',
    path: 'about/developers',
    component: DevelopersComponent,
  },
  {
    title: 'О системе',
    path: 'about/system',
    component: SystemComponent,
  },
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth/login' }, // Redirect unknown routes to login
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
