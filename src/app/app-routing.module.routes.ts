import { Routes } from '@angular/router';
import { HomeScreenComponent } from './screen/homescreen/homescreen.component';

export const routes: Routes = [
  { path: '', component: HomeScreenComponent }, 
  { path: '**', redirectTo: '' }
];
