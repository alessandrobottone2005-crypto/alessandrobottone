import { sito } from '@/config/sito'
import { ImmagineEspandibile } from '@/components/progetti/ImmagineEspandibile'

type Props = { file: string[]; layout: 'piena' | 'griglia'; titolo: string; prioritaria?: boolean }
export default function Immagini({ file, layout, titolo, prioritaria }: Props) {
  return <div className={layout === 'griglia' ? 'grid gap-4 md:grid-cols-2' : 'flex flex-col gap-4'}>
    {file.map((src, i) => <ImmagineEspandibile prioritaria={prioritaria} key={src + i} src={src} alt={sito.blocchi.immagine(titolo, i + 1)} />)}
  </div>
}
