import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        
        <div className="text-sm text-gray-600 mb-8">
          <p><strong>Last Updated:</strong> November 26, 2024</p>
          <p><strong>Effective Date:</strong> November 26, 2024</p>
        </div>

        <div className="space-y-8 text-gray-700">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="mb-4">
              By accessing or using Photo Proof ("Platform," "Service," "we," "our," or "us"), you agree 
              to be bound by these Terms of Service and our Privacy Policy. If you do not agree, do not use our services.
            </p>
            <p>
              These terms constitute a legally binding agreement between you (the "User," "you," or "your") 
              and Photo Proof, governed by the laws of India.
            </p>
          </section>

          {/* Definitions */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Definitions</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>"Studio"</strong> refers to photography businesses that create accounts to manage their clients</li>
              <li><strong>"Client"</strong> refers to customers of Studios who receive contracts and access galleries</li>
              <li><strong>"Contract"</strong> refers to digital agreements created and signed through the Platform</li>
              <li><strong>"Content"</strong> refers to all data, photos, text, contracts, and other materials on the Platform</li>
              <li><strong>"Services"</strong> refers to all features and functionality provided by Photo Proof</li>
            </ul>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Eligibility</h2>
            <p className="mb-4">To use our services, you must:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Be at least 18 years of age</li>
              <li>Have legal capacity to enter into contracts under Indian law</li>
              <li>Provide accurate and complete information during registration</li>
              <li>Not be prohibited from using our services under any applicable law</li>
            </ul>
          </section>

          {/* Studio Accounts */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Studio Accounts</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Account Creation</h3>
            <ul className="list-disc ml-6 mb-4 space-y-2">
              <li>Studios must provide accurate business information</li>
              <li>One account per business entity</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must notify us immediately of any unauthorized access</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Studio Responsibilities</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>You are responsible for all client data you upload</li>
              <li>You must have proper authorization from clients to process their data</li>
              <li>You must comply with all applicable laws (IT Act 2000, DPDPA 2023, etc.)</li>
              <li>You are the "Data Fiduciary" for your clients under DPDPA 2023</li>
              <li>You must not upload illegal, harmful, or infringing content</li>
            </ul>
          </section>

          {/* Client Access */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Client Access</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Clients can access contracts and galleries through secure links</li>
              <li>Clients are responsible for keeping their login credentials secure</li>
              <li>Clients may create accounts to manage their preferences</li>
              <li>Clients can view, sign, and download their contracts</li>
            </ul>
          </section>

          {/* Digital Signatures */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Digital Signatures</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Legal Validity</h3>
            <p className="mb-4">
              Electronic signatures created through our Platform are legally valid under the Information 
              Technology Act, 2000 and have the same legal effect as physical signatures.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Signature Methods</h3>
            <ul className="list-disc ml-6 mb-4 space-y-2">
              <li><strong>Canvas Signature:</strong> Draw your signature using mouse/finger (free)</li>
              <li><strong>Aadhaar eSign:</strong> Government-verified digital signature (additional fee may apply)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">6.3 Signature Agreement</h3>
            <p>
              By signing a contract through our Platform, you agree that your electronic signature is 
              legally binding and represents your intent to enter into the agreement.
            </p>
          </section>

          {/* Use of Services */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Acceptable Use</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 Permitted Use</h3>
            <p className="mb-4">You may use our services to:</p>
            <ul className="list-disc ml-6 mb-4 space-y-2">
              <li>Create and manage photography contracts</li>
              <li>Share photos with clients through galleries</li>
              <li>Obtain electronic signatures on contracts</li>
              <li>Manage client relationships</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">7.2 Prohibited Use</h3>
            <p className="mb-4">You must NOT:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Upload illegal, harmful, obscene, or infringing content</li>
              <li>Violate any laws or regulations</li>
              <li>Impersonate others or provide false information</li>
              <li>Attempt to hack, reverse engineer, or compromise the Platform</li>
              <li>Use automated tools to scrape or download content</li>
              <li>Resell or redistribute our services without authorization</li>
              <li>Upload viruses, malware, or harmful code</li>
              <li>Harass, abuse, or harm other users</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">8.1 Platform Ownership</h3>
            <p className="mb-4">
              Photo Proof and all its features, code, design, and trademarks are owned by us. 
              You may not copy, modify, or distribute any part of the Platform without written permission.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">8.2 Your Content</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>You retain ownership of all photos and content you upload</li>
              <li>By uploading, you grant us a license to store, display, and process your content to provide services</li>
              <li>You represent that you own or have rights to all content you upload</li>
              <li>You are responsible for copyright infringement claims related to your content</li>
            </ul>
          </section>

          {/* Payments and Fees */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Payments and Fees</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">9.1 Subscription Plans</h3>
            <ul className="list-disc ml-6 mb-4 space-y-2">
              <li>Various subscription tiers available (Free, Pro, Enterprise)</li>
              <li>Pricing displayed in Indian Rupees (INR)</li>
              <li>Plans may include storage limits, feature access, and support levels</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">9.2 Payment Terms</h3>
            <ul className="list-disc ml-6 mb-4 space-y-2">
              <li>Payments are processed through secure third-party gateways (Razorpay, Stripe)</li>
              <li>All fees are non-refundable unless otherwise stated</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
              <li>Failure to pay may result in account suspension</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">9.3 Taxes</h3>
            <p>
              All fees are exclusive of applicable taxes (GST). You are responsible for paying 
              all taxes associated with your use of the services.
            </p>
          </section>

          {/* Data Protection */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Data Protection and Privacy</h2>
            <p className="mb-4">
              We are committed to protecting your data in accordance with the Digital Personal Data 
              Protection Act (DPDPA) 2023. Please refer to our{' '}
              <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>
              {' '}for details on how we collect, use, and protect your information.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">10.1 Data Retention</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>Account data retained until deletion</li>
              <li>Signed contracts retained for 7 years (legal requirement)</li>
              <li>Activity logs retained for 3 years</li>
            </ul>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">11.1 By You</h3>
            <p className="mb-4">
              You may terminate your account at any time through Settings → Privacy → Delete Account.
              Upon termination, your data will be deleted subject to legal retention requirements.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">11.2 By Us</h3>
            <p className="mb-4">We may suspend or terminate your account if:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>You violate these Terms of Service</li>
              <li>You engage in fraudulent or illegal activity</li>
              <li>You fail to pay subscription fees</li>
              <li>We are required to do so by law</li>
            </ul>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Disclaimers</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="mb-2"><strong>THE SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</strong></p>
              <ul className="list-disc ml-6 text-sm space-y-1">
                <li>We do not guarantee uninterrupted or error-free service</li>
                <li>We are not responsible for loss of data due to technical issues</li>
                <li>We do not guarantee that the Platform meets all your requirements</li>
                <li>You use the services at your own risk</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, revenue, or business opportunities</li>
              <li>Data loss or corruption</li>
              <li>Third-party actions or content</li>
            </ul>
            <p className="mt-4">
              Our total liability shall not exceed the amount you paid us in the past 12 months, 
              or ₹10,000, whichever is less.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Photo Proof, its employees, and affiliates from 
              any claims, damages, or expenses arising from:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Your use of the services</li>
              <li>Your violation of these terms</li>
              <li>Your violation of any laws or third-party rights</li>
              <li>Content you upload to the Platform</li>
            </ul>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">15.1 Governing Law</h3>
            <p className="mb-4">
              These Terms are governed by the laws of India. Any disputes shall be subject to the 
              exclusive jurisdiction of courts in [Your City], India.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">15.2 Arbitration</h3>
            <p>
              Any disputes arising from these Terms shall be resolved through arbitration in accordance 
              with the Arbitration and Conciliation Act, 1996.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Material changes will be notified via email 
              or prominent notice on the Platform. Continued use after changes constitutes acceptance.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Contact Information</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="mb-2"><strong>Photo Proof</strong></p>
              <p className="text-sm mb-1">Email: <a href="mailto:support@photoproof.com" className="text-blue-600 hover:underline">support@photoproof.com</a></p>
              <p className="text-sm mb-1">Legal: <a href="mailto:legal@photoproof.com" className="text-blue-600 hover:underline">legal@photoproof.com</a></p>
              <p className="text-sm">Address: [Your Business Address]</p>
            </div>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable, the remaining provisions 
              shall remain in full force and effect.
            </p>
          </section>

          {/* Entire Agreement */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">19. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between 
              you and Photo Proof regarding the use of our services.
            </p>
          </section>

          {/* Legal Disclaimer */}
          <section className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Legal Disclaimer</h2>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Note:</strong> This is a template Terms of Service. It MUST be reviewed and customized by 
              a qualified Indian lawyer before publication.
            </p>
            <p className="text-sm text-gray-700">
              This document should be updated to reflect your actual business practices, jurisdiction, 
              and specific services offered. Consult with legal counsel to ensure compliance with all 
              applicable Indian laws.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
