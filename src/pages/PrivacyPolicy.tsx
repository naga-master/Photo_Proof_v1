import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        
        <div className="text-sm text-gray-600 mb-8">
          <p><strong>Last Updated:</strong> November 26, 2024</p>
          <p><strong>Effective Date:</strong> November 26, 2024</p>
        </div>

        <div className="space-y-8 text-gray-700">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to Photo Proof ("we," "our," or "us"). We are committed to protecting your personal data 
              and respecting your privacy rights under India's Digital Personal Data Protection Act (DPDPA) 2023.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, store, and protect your personal information 
              when you use our photography contract management platform.
            </p>
          </section>

          {/* Data We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. What Data We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 For Studio Owners:</h3>
            <ul className="list-disc ml-6 mb-4 space-y-2">
              <li><strong>Account Information:</strong> Business name, your name, email address, phone number</li>
              <li><strong>Business Information:</strong> Studio address, branding preferences, domain name</li>
              <li><strong>Client Data:</strong> Client names, emails, phones (provided by you)</li>
              <li><strong>Usage Data:</strong> Login times, IP addresses, device information, browser type</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 For Clients:</h3>
            <ul className="list-disc ml-6 mb-4 space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, phone number</li>
              <li><strong>Signature Data:</strong> Digital signature (canvas signature or Aadhaar eSign)</li>
              <li><strong>Contract Information:</strong> Signed contracts, timestamps, IP addresses</li>
              <li><strong>Photos:</strong> Images uploaded by your photographer (stored on your behalf)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Automatically Collected:</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>IP address and geolocation (for security and fraud prevention)</li>
              <li>Device information (browser type, operating system)</li>
              <li>Cookies and similar technologies (see Section 8)</li>
            </ul>
          </section>

          {/* Why We Collect Data */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Why We Collect Your Data</h2>
            <p className="mb-4">We use your data for the following purposes:</p>
            
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Account Management:</strong> Create and manage your account</li>
              <li><strong>Service Delivery:</strong> Enable contract creation, signing, and management</li>
              <li><strong>Communication:</strong> Send transaction emails, contract notifications</li>
              <li><strong>Legal Compliance:</strong> Comply with Indian laws (IT Act 2000, DPDPA 2023)</li>
              <li><strong>Security:</strong> Prevent fraud, unauthorized access, and data breaches</li>
              <li><strong>Improvement:</strong> Analyze usage to improve our services (with your consent)</li>
            </ul>
          </section>

          {/* How Long We Keep Data */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How Long We Keep Your Data</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm"><strong>Important:</strong> Indian law requires retention of certain data for legal compliance.</p>
            </div>

            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Account Data:</strong> Until you delete your account</li>
              <li><strong>Signed Contracts:</strong> 7 years after signing (legal requirement)</li>
              <li><strong>Payment Records:</strong> 7 years (tax compliance)</li>
              <li><strong>Activity Logs:</strong> 3 years (security and audit)</li>
              <li><strong>Marketing Consent:</strong> Until you withdraw consent</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Who We Share Your Data With</h2>
            <p className="mb-4">We do NOT sell your data. We only share with:</p>
            
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Aadhaar eSign Provider:</strong> Only if you choose Aadhaar-based signatures (eMudhra, NSDL, etc.)</li>
              <li><strong>Email Service:</strong> For sending notifications (AWS SES, SendGrid)</li>
              <li><strong>Cloud Storage:</strong> For storing photos and contracts (AWS S3, encrypted)</li>
              <li><strong>Payment Gateway:</strong> For processing payments (Razorpay, Stripe - PCI DSS compliant)</li>
              <li><strong>Legal Authorities:</strong> If required by law or court order</li>
            </ul>

            <p className="mt-4">
              All third-party processors are contractually bound to protect your data and use it only for specified purposes.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights Under DPDPA 2023</h2>
            <p className="mb-4">You have the following rights:</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">✅ Right to Access</h4>
                <p className="text-sm">See what data we have about you</p>
                <p className="text-xs text-gray-600 mt-2">Go to: Settings → Privacy → My Data</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">✏️ Right to Correction</h4>
                <p className="text-sm">Update incorrect information</p>
                <p className="text-xs text-gray-600 mt-2">Go to: Settings → Profile → Edit</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📥 Right to Portability</h4>
                <p className="text-sm">Download your data (JSON/CSV)</p>
                <p className="text-xs text-gray-600 mt-2">Go to: Settings → Privacy → Export Data</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🗑️ Right to Erasure</h4>
                <p className="text-sm">Delete your account</p>
                <p className="text-xs text-gray-600 mt-2">Go to: Settings → Privacy → Delete Account</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🚫 Right to Withdraw Consent</h4>
                <p className="text-sm">Change your consent preferences</p>
                <p className="text-xs text-gray-600 mt-2">Go to: Settings → Privacy → Consent</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">⚖️ Right to Grievance Redressal</h4>
                <p className="text-sm">File a complaint</p>
                <p className="text-xs text-gray-600 mt-2">Email: privacy@photoproof.com</p>
              </div>
            </div>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. How We Protect Your Data</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Encryption:</strong> AES-256 encryption for data at rest, TLS 1.3 for data in transit</li>
              <li><strong>Access Controls:</strong> Role-based access, two-factor authentication available</li>
              <li><strong>Regular Backups:</strong> Automated backups with encryption</li>
              <li><strong>Security Audits:</strong> Regular vulnerability assessments</li>
              <li><strong>Secure Servers:</strong> AWS infrastructure with SOC 2 compliance</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
            <p className="mb-4">We use cookies for:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Essential Cookies:</strong> Login sessions, security (cannot be disabled)</li>
              <li><strong>Analytics Cookies:</strong> Usage statistics (only with your consent)</li>
              <li><strong>Preference Cookies:</strong> Remember your settings</li>
            </ul>
            <p className="mt-4 text-sm">
              You can manage cookie preferences in your browser settings.
            </p>
          </section>

          {/* Data Breach */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Breach Notification</h2>
            <p className="mb-4">
              In the unlikely event of a data breach affecting your personal information, we will:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Notify the Data Protection Board of India within 72 hours</li>
              <li>Notify affected users immediately via email</li>
              <li>Explain what data was affected and what steps we're taking</li>
              <li>Provide guidance on protecting yourself</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p>
              Our services are not intended for individuals under 18 years of age. We do not knowingly 
              collect personal data from children. If you believe a child has provided us with personal 
              data, please contact us immediately.
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Data Transfers</h2>
            <p>
              Your data is primarily stored on servers in India. If we transfer data outside India, 
              we ensure adequate safeguards are in place as required by DPDPA 2023.
            </p>
          </section>

          {/* Policy Updates */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material 
              changes by email or prominent notice on our platform. Your continued use after changes 
              constitutes acceptance.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="mb-2"><strong>Data Protection Officer:</strong></p>
              <p className="text-sm mb-1">Email: <a href="mailto:privacy@photoproof.com" className="text-blue-600 hover:underline">privacy@photoproof.com</a></p>
              <p className="text-sm mb-1">Email: <a href="mailto:dpo@photoproof.com" className="text-blue-600 hover:underline">dpo@photoproof.com</a></p>
              <p className="text-sm mb-1">Support: <a href="mailto:support@photoproof.com" className="text-blue-600 hover:underline">support@photoproof.com</a></p>
              <p className="text-sm">Response Time: Within 30 days</p>
            </div>
          </section>

          {/* Grievance Redressal */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Grievance Redressal</h2>
            <p className="mb-4">
              If you have concerns about how we handle your data:
            </p>
            <ol className="list-decimal ml-6 space-y-2">
              <li>Contact our Data Protection Officer (details above)</li>
              <li>We will acknowledge within 7 days and resolve within 30 days</li>
              <li>If unsatisfied, you can approach the Data Protection Board of India</li>
            </ol>
          </section>

          {/* Legal Disclaimer */}
          <section className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Legal Disclaimer</h2>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Note:</strong> This is a template Privacy Policy. It MUST be reviewed and customized by 
              a qualified Indian IT lawyer before publication.
            </p>
            <p className="text-sm text-gray-700">
              This document should be updated to reflect your actual data practices, third-party processors, 
              and specific business operations. Consult with legal counsel to ensure full DPDPA 2023 compliance.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
