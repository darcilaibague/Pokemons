import { Routes } from '@angular/router';
import { GalleryComponent } from './pages/gallery/gallery.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'page/1' },

  { path: 'page/:page', component: GalleryComponent },
  { path: 'page/:page/:id', component: GalleryComponent },
  { path: 'pokemon/:id', component: GalleryComponent },

  { path: '**', redirectTo: 'page/1' },
];
