// Pezzi a pixel 16×16 disegnati per il portfolio: '#' contorno, '.' corpo, 'x' dettaglio.
// Bianchi: corpo chiaro e dettagli scuri. Neri: corpo scuro e dettagli chiari.
import type { PieceSymbol } from 'chess.js'

const PEZZI: Record<PieceSymbol, string[]> = {
  p: [
    '                ',
    '                ',
    '                ',
    '      ####      ',
    '     #....#     ',
    '     #....#     ',
    '      #..#      ',
    '     #xxxx#     ',
    '      #..#      ',
    '      #..#      ',
    '     #....#     ',
    '    #......#    ',
    '   #........#   ',
    '   ##########   ',
    '                ',
    '                ',
  ],
  r: [
    '                ',
    '  ### #### ###  ',
    '  #.###..###.#  ',
    '  #..........#  ',
    '   #xxxxxxxx#   ',
    '    #......#    ',
    '    #......#    ',
    '    #......#    ',
    '    #......#    ',
    '    #......#    ',
    '   #xxxxxxxx#   ',
    '   #........#   ',
    '  #..........#  ',
    '  ############  ',
    '                ',
    '                ',
  ],
  n: [
    '                ',
    '      ## #      ',
    '     #..#.#     ',
    '    #......#    ',
    '   #..x.....#   ',
    '  #..........#  ',
    '  #.....##...#  ',
    '   #####  #..#  ',
    '         #...#  ',
    '        #....#  ',
    '       #.....#  ',
    '      #......#  ',
    '     #xxxxxxx#  ',
    '    #.........# ',
    '    ########### ',
    '                ',
  ],
  b: [
    '                ',
    '       ##       ',
    '      #..#      ',
    '       ##       ',
    '      #..#      ',
    '     #..x.#     ',
    '    #..x...#    ',
    '    #.x....#    ',
    '    #......#    ',
    '     #....#     ',
    '      #..#      ',
    '     #xxxx#     ',
    '    #......#    ',
    '   ##########   ',
    '                ',
    '                ',
  ],
  q: [
    '                ',
    '  #   #  #   #  ',
    '  ## #.##.# ##  ',
    '  #.#.#..#.#.#  ',
    '  #..........#  ',
    '   #........#   ',
    '   #........#   ',
    '    #......#    ',
    '    #xxxxxx#    ',
    '    #......#    ',
    '   #........#   ',
    '   #xxxxxxxx#   ',
    '  #..........#  ',
    '  ############  ',
    '                ',
    '                ',
  ],
  k: [
    '       ##       ',
    '      #..#      ',
    '     #....#     ',
    '      #..#      ',
    '   ### ## ###   ',
    '  #...#..#...#  ',
    '  #....##....#  ',
    '  #..........#  ',
    '   #........#   ',
    '    #......#    ',
    '    #xxxxxx#    ',
    '    #......#    ',
    '   #........#   ',
    '   #xxxxxxxx#   ',
    '  #..........#  ',
    '  ############  ',
  ],
}

const cache = new Map<string, string[]>()

/** righe pronte per PixelSvg ('#' inchiostro, '.' carta) */
export function righePezzo(tipo: PieceSymbol, colore: 'w' | 'b') {
  const chiave = tipo + colore
  let righe = cache.get(chiave)
  if (!righe) {
    righe = PEZZI[tipo].map((r) => (colore === 'w' ? r.replaceAll('x', '#') : r.replaceAll('.', '#').replaceAll('x', '.')))
    cache.set(chiave, righe)
  }
  return righe
}
