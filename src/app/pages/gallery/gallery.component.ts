import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { PokeApiService, PokemonCardVM, PokemonDetailVM } from '../../core/services/pokeapi.service';
import { CapitalizePipe } from '../../shared/pipe/capitalize.pipe';

/**
 * GalleryComponent
 * - Muestra una Pokédex paginada (30 por página) consumiendo PokéAPI.
 * - Permite abrir el detalle de un Pokémon en un Drawer sincronizado con la URL.
 * - Soporta deep-link: /page/:page/:id abre el drawer automáticamente.
 * - Incluye navegación por páginas e input para ir a un Pokémon por ID.
 */

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    CapitalizePipe,
  ],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements AfterViewInit {
  pokemons: PokemonCardVM[] = [];
  loadingList = true;

  selected: PokemonDetailVM | null = null;
  loadingDetail = false;

  @ViewChild('drawer') drawer!: MatDrawer;

  readonly PAGE_SIZE = 30;
  page = 1;
  totalCount = 0;

  private pendingDetailId: number | null = null;

  constructor(
    private api: PokeApiService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const pageParam = Number(params.get('page') ?? '1');
      this.page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

      this.loadPage(this.page);

      const idParam = params.get('id');
      if (idParam) {
        const id = Number(idParam);
        if (Number.isFinite(id) && id > 0) {
          this.pendingDetailId = id;
          if (this.drawer) this.openDetail(id);
        }
      } else {
        this.selected = null;
        this.pendingDetailId = null;
        if (this.drawer) this.drawer.close();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.pendingDetailId) {
      this.openDetail(this.pendingDetailId);
      this.pendingDetailId = null;
    }
  }

  loadPage(page: number): void {
    this.loadingList = true;

    this.api.getPokemonPage(this.PAGE_SIZE, page).subscribe({
      next: (res) => {
        this.totalCount = res.count;
        const names = res.results.map((r: any) => r.name);

        this.api.getPokemonsByNames(names).subscribe({
          next: (list) => {
            this.pokemons = list;
            this.loadingList = false;
          },
          error: () => (this.loadingList = false)
        });
      },
      error: () => (this.loadingList = false)
    });
  }

  openDetail(id: number): void {
    this.loadingDetail = true;
    this.drawer.open();

    this.api.getPokemonDetail(id).subscribe({
      next: (detail) => {
        this.selected = detail;
        this.loadingDetail = false;
      },
      error: () => {
        this.loadingDetail = false;
      }
    });
  }

  onOpen(p: PokemonCardVM): void {
    this.router.navigateByUrl(`/page/${this.page}/${p.id}`);
  }

  onClose(): void {
    this.router.navigateByUrl(`/page/${this.page}`);
  }

  goToId(raw: string): void {
    const id = Number(raw);
    if (!Number.isFinite(id) || id <= 0) return;

    const targetPage = Math.floor((id - 1) / this.PAGE_SIZE) + 1;
    this.router.navigateByUrl(`/page/${targetPage}/${id}`);
  }
  prevPage(): void {
    if (this.page <= 1) return;
    this.router.navigateByUrl(`/page/${this.page - 1}`);
  }

  nextPage(): void {
    if (this.page * this.PAGE_SIZE >= this.totalCount) return;
    this.router.navigateByUrl(`/page/${this.page + 1}`);
  }
}
