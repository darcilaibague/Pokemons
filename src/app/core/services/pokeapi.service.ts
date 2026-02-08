import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';

const API = 'https://pokeapi.co/api/v2';

export interface PokemonCardVM {
  id: number;
  name: string;
  image: string;
  abilities: string[];
  types: string[];
  summary: string; // requerido por el punto 2
}

export interface PokemonDetailVM extends PokemonCardVM {
  height: number;
  weight: number;
  stats: { name: string; value: number }[];
}

@Injectable({ providedIn: 'root' })
export class PokeApiService {
  constructor(private http: HttpClient) { }

  getPokemon(id: number): Observable<any> {
    return this.http.get(`${API}/pokemon/${id}`);
  }

  getPokemonsByIds(ids: number[]): Observable<PokemonCardVM[]> {
    return forkJoin(ids.map(id => this.getPokemon(id))).pipe(
      map(list => list.map(p => this.toCardVM(p)).sort((a, b) => a.id - b.id))
    );
  }


  getRandomPokemonIds(count = 30, maxId = 1010): number[] {
    const set = new Set<number>();
    while (set.size < count) {
      const id = Math.floor(Math.random() * maxId) + 1;
      set.add(id);
    }
    return [...set];
  }

  getRandomPokemons(count = 30): Observable<PokemonCardVM[]> {
    const ids = this.getRandomPokemonIds(count);
    return forkJoin(ids.map(id => this.getPokemon(id))).pipe(
      map(list => list.map(p => this.toCardVM(p)).sort((a, b) => a.id - b.id))
    );
  }

  getPokemonDetail(id: number): Observable<PokemonDetailVM> {
    return this.getPokemon(id).pipe(map(p => this.toDetailVM(p)));
  }

  toCardVM(p: any): PokemonCardVM {
    const abilities = (p.abilities ?? []).map((a: any) => a.ability?.name).filter(Boolean);
    const types = (p.types ?? []).map((t: any) => t.type?.name).filter(Boolean);
    const image =
      p.sprites?.other?.['official-artwork']?.front_default ||
      p.sprites?.front_default ||
      '';

    const summary = this.buildSummary(p.name, abilities, types);

    return {
      id: p.id,
      name: p.name,
      image,
      abilities,
      types,
      summary
    };
  }

  private toDetailVM(p: any): PokemonDetailVM {
    const base = this.toCardVM(p);
    const stats = (p.stats ?? []).map((s: any) => ({
      name: s.stat?.name,
      value: s.base_stat
    }));

    return {
      ...base,
      height: p.height,
      weight: p.weight,
      stats
    };
  }

  private buildSummary(name: string, abilities: string[], types: string[]): string {
    const n = name ? (name.charAt(0).toUpperCase() + name.slice(1)) : 'Este Pokémon';
    const ab = abilities?.length ? abilities.join(', ') : 'habilidades desconocidas';
    const tp = types?.length ? types.join(', ') : 'tipo desconocido';
    return `${n} es de tipo ${tp} y cuenta con habilidades como ${ab}.`;
  }

  getPokemonPage(limit: number, page: number) {
    const offset = (page - 1) * limit;
    return this.http.get<any>(`${API}/pokemon?limit=${limit}&offset=${offset}`).pipe(
      map(res => ({
        count: res.count as number,
        results: res.results as { name: string; url: string }[]
      }))
    );
  }

  getPokemonsByNames(names: string[]): Observable<PokemonCardVM[]> {
    return forkJoin(names.map(n => this.http.get(`${API}/pokemon/${n}`))).pipe(
      map(list => list.map(p => this['toCardVM'](p))) // si toCardVM es private, mejor duplicar o volverlo public
    );
  }

}