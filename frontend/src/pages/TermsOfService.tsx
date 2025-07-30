import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <main className="pt-16 pb-20 md:pb-4">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Terms of Service</h1>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-6">
            <div className="mb-6">
              <p className="text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>

            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Nstyle ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground">
                Nstyle is a social networking platform designed for nail enthusiasts and salon professionals to share content, discover nail art, book appointments, and connect with the nail community.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Safeguarding your password and account information</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Content and Conduct</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>You agree not to post content that:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Is illegal, harmful, threatening, abusive, or harassing</li>
                  <li>Violates any person's privacy or publicity rights</li>
                  <li>Contains viruses or other malicious code</li>
                  <li>Is spam or unsolicited promotional material</li>
                  <li>Infringes on intellectual property rights</li>
                  <li>Is false, misleading, or deceptive</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>You retain ownership of content you post, but grant us a license to use it. The Service and its original content, features, and functionality are owned by Nstyle and are protected by international copyright, trademark, and other intellectual property laws.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Booking and Payments</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>When booking appointments through our platform:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You agree to the salon's terms and cancellation policies</li>
                  <li>Payment processing is handled by third-party providers</li>
                  <li>We are not responsible for service quality or disputes</li>
                  <li>Refunds are subject to individual salon policies</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Privacy</h2>
              <p className="text-muted-foreground">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Termination</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including if you breach the Terms. Upon termination:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Your right to use the Service ceases immediately</li>
                  <li>We may delete your account and content</li>
                  <li>Some provisions of these Terms survive termination</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Disclaimers</h2>
              <p className="text-muted-foreground">
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We disclaim all warranties, whether express or implied, including merchantability, fitness for a particular purpose, and non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                In no event shall Nstyle be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be interpreted and governed by the laws of the State of New York, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Contact Information</h2>
              <div className="text-muted-foreground">
                <p>If you have any questions about these Terms, please contact us at:</p>
                <div className="mt-3 space-y-1">
                  <p>Email: legal@nstyle.app</p>
                  <p>Address: 123 Beauty Street, New York, NY 10001</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default TermsOfService;