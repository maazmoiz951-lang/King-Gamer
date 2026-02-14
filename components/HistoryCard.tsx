
import React from 'react';
import { GeneratedImage } from '../types';

interface HistoryCardProps {
  image: GeneratedImage;
  onSelect: (image: GeneratedImage) => void;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ image, onSelect }) => {
  return (
    <div 
      className="group relative rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] bg-slate-800 border border-slate-700"
      onClick={() => onSelect(image)}
    >
      <img 
        src={image.url} 
        alt={image.prompt} 
        className="w-full aspect-square object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
        <p className="text-xs text-slate-200 line-clamp-2">{image.prompt}</p>
        <span className="text-[10px] text-slate-400 mt-1 capitalize">{image.type}</span>
      </div>
    </div>
  );
};

export default HistoryCard;
