const loadedFonts = new Set<string>();

export function loadGoogleFont(family: string): void {
  const key = family.toLowerCase().trim();
  if (loadedFonts.has(key)) return;
  loadedFonts.add(key);
  const link = document.createElement("link");
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, "+")}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap`;
  link.rel = "stylesheet";
  document.head.appendChild(link);
}

export const GOOGLE_FONTS = [
  "Roboto", "Open Sans", "Montserrat", "Lato", "Poppins", "Inter",
  "Oswald", "Raleway", "Nunito", "Ubuntu", "Playfair Display",
  "Merriweather", "PT Sans", "Noto Sans", "Quicksand", "Work Sans",
  "Rubik", "Fira Sans", "Source Sans Pro", "Titillium Web",
  "Mukta", "Muli", "Exo 2", "Josefin Sans", "Dosis",
  "Hind", "Catamaran", "Karla", "Barlow", "Inconsolata",
  "Crimson Text", "Libre Baskerville", "Lora", "EB Garamond",
  "DM Sans", "DM Serif Display", "DM Serif Text", "Heebo",
  "Nanum Gothic", "Nanum Myeongjo", "Noto Serif", "PT Serif",
  "Abril Fatface", "Alfa Slab One", "Anton", "Archivo Black",
  "Bebas Neue", "Bitter", "Bree Serif", "Cabin", "Cairo",
  "Chakra Petch", "Comfortaa", "Concert One", "Cormorant Garamond",
  "Courgette", "Crete Round", "Dancing Script", "Domine",
  "Economica", "Fira Mono", "Fjalla One", "Francois One",
  "IBM Plex Sans", "IBM Plex Mono", "IBM Plex Serif", "Jost",
  "Kanit", "Kaushan Script", "Lemon", "Libre Franklin",
  "Lilita One", "Lobster", "Lobster Two", "Luckiest Guy",
  "Manrope", "Maven Pro", "Noticia Text", "Orbitron",
  "Overpass", "Oxygen", "Pacifico", "Passion One",
  "Pathway Gothic One", "Patua One", "Paytone One", "Permanent Marker",
  "Philosopher", "Play", "Proza Libre", "Questrial",
  "Rajdhani", "Red Hat Display", "Red Hat Text", "Righteous",
  "Roboto Condensed", "Roboto Mono", "Roboto Slab", "Saira",
  "Satisfy", "Shadows Into Light", "Signika", "Six Caps",
  "Slabo 27px", "Source Code Pro", "Space Grotesk", "Space Mono",
  "Spartan", "Staatliches", "Teko", "Titillium Web",
  "Varela Round", "Vollkorn", "Yanone Kaffeesatz", "Zilla Slab",
].sort();
