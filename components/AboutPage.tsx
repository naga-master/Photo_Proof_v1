import React from 'react';

interface AboutPageProps {
    studioPhoto: string | null;
    studioDescription: string;
}

const AboutPage: React.FC<AboutPageProps> = ({ studioPhoto, studioDescription }) => {
    // Default content if studio hasn't set their own
    const defaultImage = 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-4.0.3&auto=format&fit=crop&w=2080&q=80';
    const defaultDescription = `We are NAPSTER's Photo Lab, a boutique photography studio dedicated to capturing life's fleeting moments with artistry and authenticity. Our passion lies in creating timeless images that tell your unique story.

With over a decade of experience, we specialize in weddings, portraits, and lifestyle photography. Every session is crafted with care, attention to detail, and a deep respect for the emotions that make each moment special.

We believe photography is more than just images—it's about preserving memories, celebrating love, and honoring the beauty of everyday life. Let us help you tell your story.`;

    const displayImage = studioPhoto || defaultImage;
    const displayDescription = studioDescription || defaultDescription;
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-serif tracking-wider text-gray-800">About Us</h1>
            <p className="mt-4 text-xl text-gray-500">Capturing life's fleeting moments.</p>
          </div>

          <div className="mt-16 grid md:grid-cols-2 gap-12 items-start">
            {/* Image */}
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={displayImage}
                alt="Studio"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              {displayDescription.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;