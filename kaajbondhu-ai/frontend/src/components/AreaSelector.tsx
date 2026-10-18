import { MapPin } from 'lucide-react';
import { useId } from 'react';

export default function AreaSelector({ area, areas, onChange }: { area: string; areas: string[]; onChange: (area: string) => void }) {
  const id = useId();
  return <div>
    <label htmlFor={id} className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#64807a]"><MapPin className="size-4 text-primary" /> Your neighborhood</label>
    <select id={id} className="field" value={area} onChange={event => onChange(event.target.value)}>
      <option value="">Choose a neighborhood</option>
      {areas.map(name => <option key={name}>{name}</option>)}
    </select>
  </div>;
}
