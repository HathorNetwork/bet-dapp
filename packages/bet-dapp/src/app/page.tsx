import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BASE_PATH } from '@/constants';

interface CharacterCardProps {
  src: string;
  alt: string;
  className?: string;
}

interface Character {
  src: string;
  alt: string;
}

interface IconBarProps {
  BASE_PATH: string;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ src, alt, className = "" }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-purple-950 ${className}`}>
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="object-cover hover:scale-105 transition-transform duration-300"
      priority
    />
  </div>
);

const CharacterGrid: React.FC<{ BASE_PATH: string }> = ({ BASE_PATH }) => {
  const characters: Character[] = [
    { src: `${BASE_PATH}/opening_screen_guilds_1.png`, alt: 'Character' },
    { src: `${BASE_PATH}/opening_screen_guilds_2.png`, alt: 'Character' },
    { src: `${BASE_PATH}/opening_screen_guilds_3.png`, alt: 'Character' },
    { src: `${BASE_PATH}/opening_screen_guilds_4.png`, alt: 'Character' },
    { src: `${BASE_PATH}/opening_screen_guilds_5.png`, alt: 'Character' },
  ];

  return (
    <div className="flex-1 w-full max-w-xl ml-auto px-4">
      <div className="space-y-4">
        {/* Top 4 characters */}
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4 justify-end">
          {characters.slice(0, 4).map((char, index) => (
            <div 
              key={index} 
              className="w-32 lg:w-full ml-auto"
            >
              <CharacterCard
                src={char.src}
                alt={char.alt}
                className="aspect-square w-full h-full"
              />
            </div>
          ))}
        </div>
        
        {/* Bottom wide character */}
        <div className="hidden lg:block w-full ml-auto"> {/* Changed mx-auto to ml-auto */}
          <CharacterCard 
            src={characters[4].src}
            alt={characters[4].alt}
            className="aspect-[3/1.2] w-full"
          />
        </div>
      </div>
    </div>
  );
};

const EgyptianIconBar: React.FC<IconBarProps> = ({ BASE_PATH }) => {
  const icons = [
    { src: '/visual-elements/03_Opening-Screen_Icon-God.png', alt: 'God Icon' },
    { src: '/visual-elements/04_Opening-Screen_Icon-Pharao.png', alt: 'Pharao Icon' },
    { src: '/visual-elements/05_Opening-Screen_Icon-Priest.png', alt: 'Priest Icon' },
    { src: '/visual-elements/06_Opening-Screen_Icon-Noble.png', alt: 'Noble Icon' },
    { src: '/visual-elements/07_Opening-Screen_Icon-Artisan.png', alt: 'Artisan Icon' },
    { src: '/visual-elements/07_Opening-Screen_Icon-Scribe.png', alt: 'Scribe Icon' },
    { src: '/visual-elements/09_Opening-Screen_Icon-Builder.png', alt: 'Builder Icon' },
    { src: '/visual-elements/10_Opening-Screen_Icon-Servent.png', alt: 'Servent Icon' },
  ];

  return (
    <div className="flex flex-col items-center mt-24">
      {icons.map((icon, index) => (
        <div 
          key={index}
          className="w-20 h-20 relative transition-transform duration-300"
        >
          <Image
            src={`${BASE_PATH}${icon.src}`}
            alt={icon.alt}
            fill
            className="object-contain"
          />
        </div>
      ))}
    </div>
  );
};

export default function Home() {
  return (
    <main className="bg-desert-background bg-cover flex min-h-screen items-center justify-center p-6 flex-col">
      <div className="relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-6xl w-full p-6 bg-home-background border border-gray-800 ">
        <div className="absolute inset-0 bg-black opacity-10 rounded-lg"></div>
        
        {/* Left Content */}
        <div className="relative z-10 w-full md:w-3/4 lg:w-1/2 pr-8">

          <div className="mb-4">
            <Image 
              alt="Lettering Pharaohs Quest" 
              width={400} 
              height={80} 
              src={`${BASE_PATH}/lettering-pharaohs-quest.png`}
              className="mb-2 ml-8" 
            />
            <Image 
              alt="Lettering Nanos" 
              width={400} 
              height={80} 
              src={`${BASE_PATH}/lettering-nanos.png`} 
            />
          </div>
          
          <div className="mt-6 ml-16 mr-2">
            <p className="text-white text-base leading-relaxed mb-4">
              Step into the realm of Hathor, where the sands of fortune await your command. Here, you have the power to craft your own betting contracts and join the legendary wagers of the ancients.
            </p>
            <p className="text-white">
              Embark on the Pharaoh&apos;s Quest and Play to Qualify for <span className="font-bold">HTR Airdrops!</span>
            </p>
            <Button className="rounded-sm text-white px-6 py-3 h-12 text-lg mt-6 mb-8">
              <Link href='/create'>
                Start now!
              </Link>
            </Button>
          </div>
        </div>

        {/* Right Content */}
        <div className="hidden md:flex relative z-10 w-1/4 lg:w-1/2 gap-4 mb-12">
          <div className="flex-1 flex-col items-end mr-2">
            <div className='flex items-end mt-8 mb-12 mr-4'>
              <div className='w-full'></div>
              <Image alt="Hathor" width={150} height={50} src={`${BASE_PATH}/logo_white.svg`}/>
            </div>
            <CharacterGrid BASE_PATH={BASE_PATH} />
          </div>
          <div className="w-12">
            <EgyptianIconBar BASE_PATH={BASE_PATH} />
          </div>
        </div>
      </div>
      
      <span className="mt-4 text-sm text-hathor-purple-500">
        v0.4.0
      </span>
    </main>
  );
}
