const mentionLogos = [
  {
    id: "logo-1",
    description: "Product design studio",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
    className:
      "h-16 w-16 rounded-2xl border border-border object-cover shadow-sm grayscale transition duration-300 hover:-translate-y-1 hover:grayscale-0",
  },
  {
    id: "logo-2",
    description: "Creative workspace",
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80",
    className:
      "h-16 w-16 rounded-2xl border border-border object-cover shadow-sm grayscale transition duration-300 hover:-translate-y-1 hover:grayscale-0",
  },
  {
    id: "logo-3",
    description: "Sprint planning",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    className:
      "h-16 w-16 rounded-2xl border border-border object-cover shadow-sm grayscale transition duration-300 hover:-translate-y-1 hover:grayscale-0",
  },
  {
    id: "logo-4",
    description: "Team collaboration",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    className:
      "h-16 w-16 rounded-2xl border border-border object-cover shadow-sm grayscale transition duration-300 hover:-translate-y-1 hover:grayscale-0",
  },
  {
    id: "logo-5",
    description: "Brainstorming session",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
    className:
      "h-16 w-16 rounded-2xl border border-border object-cover shadow-sm grayscale transition duration-300 hover:-translate-y-1 hover:grayscale-0",
  },
  {
    id: "logo-6",
    description: "Remote product team",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    className:
      "h-16 w-16 rounded-2xl border border-border object-cover shadow-sm grayscale transition duration-300 hover:-translate-y-1 hover:grayscale-0",
  },
];

export const Mentions = () => {
  return (
    <div className="w-full border-y-2 border-border py-16 bg-background">
      <h2 className="mb-10 text-center text-sm font-medium text-muted-foreground">
        Trusted by product teams sketching, planning, and shipping faster
      </h2>

      <div className="relative flex w-full overflow-hidden group">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

        <div className="flex w-max animate-marquee">
          <div className="flex min-w-full shrink-0 items-center justify-around gap-8 px-4">
            {mentionLogos.map((logo) => (
              <img
                key={logo.id}
                src={logo.image}
                alt={logo.description}
                title={logo.description}
                className={logo.className}
              />
            ))}
          </div>

          <div
            aria-hidden="true"
            className="flex min-w-full shrink-0 items-center justify-around gap-8 px-4"
          >
            {mentionLogos.map((logo) => (
              <img
                key={`duplicate-${logo.id}`}
                src={logo.image}
                alt={logo.description}
                className={logo.className}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        /* Pauses the animation when the user hovers over the carousel */
        .group:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
