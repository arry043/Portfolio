import { memo, useState } from 'react';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80';

const ImageWithSkeleton = ({ src, alt, className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSource, setImageSource] = useState(src || FALLBACK_IMAGE);

  return (
    <div className={`relative overflow-hidden bg-zinc-900 ${className}`}>
      {!isLoaded ? <div className="absolute inset-0 animate-pulse bg-zinc-800/70" /> : null}
      <img
        src={imageSource}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setImageSource(FALLBACK_IMAGE);
          setIsLoaded(true);
        }}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default memo(ImageWithSkeleton);
