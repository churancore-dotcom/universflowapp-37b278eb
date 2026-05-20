import { prefetchSong } from '../lib/jiosaavn';

interface Props {
  song: any;
  index: number;
  onPlay: (id: string, index: number) => void;
}

export default function SongCard({ song, index, onPlay }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '10px',
        cursor: 'pointer',
        background: '#111',
        marginBottom: '8px',
        transition: 'background 0.2s',
      }}
      onMouseEnter={() => prefetchSong(song.id)}
      onMouseOver={e => (e.currentTarget.style.background = '#1a1a1a')}
      onMouseOut={e => (e.currentTarget.style.background = '#111')}
      onClick={() => onPlay(song.id, index)}
    >
      <img
        src={song.image[1]?.url}
        alt={song.name}
        style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
      />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{
          color: '#fff', margin: 0, fontWeight: 600,
          fontSize: 14, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {song.name}
        </p>
        <p style={{
          color: '#aaa', margin: 0, fontSize: 12,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {song.artists.primary.map((a: any) => a.name).join(', ')}
        </p>
      </div>
      <span style={{ color: '#666', fontSize: 12 }}>
        {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
      </span>
    </div>
  );
}
