import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-serif tracking-wider text-gray-800">About Us</h1>
            <p className="mt-4 text-xl text-gray-500">Capturing life's fleeting moments.</p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1480&auto=format&fit=crop"
                alt="The Scobeys"
                className="rounded-lg shadow-xl"
              />
            </div>
            <div className="prose prose-lg text-gray-600">
              <p>
                We are the Scobeys, a husband and wife photography duo with a passion for storytelling. 
                Our journey began with a shared love for capturing the authentic, unscripted moments that make life beautiful.
              </p>
              <p>
                For us, photography is more than just taking pictures; it's about preserving memories, emotions, and the essence of a moment in time. 
                We specialize in wedding and portrait photography, where we get the privilege of being part of some of the most important days in people's lives.
              </p>
              <p>
                Our style is a blend of documentary and fine art. We aim to be unobtrusive observers, capturing the day as it naturally unfolds, while also creating timeless, artistic portraits that you'll cherish for generations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
