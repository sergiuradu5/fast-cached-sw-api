import { MappedFilm } from './mapped-film.interface';
import { MappedStarship } from './mapped-starship.interface';

export interface MappedPerson {
  id: string;
  name: string;
  height: string;
  mass: string;
  gender: string;
  starships: MappedStarship[];
  films?: MappedFilm[];
  image: string;
}
