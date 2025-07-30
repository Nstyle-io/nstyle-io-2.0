import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';

const PrivacyPolicy = () => {
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
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-6">
            <div className="mb-6">
              <p className="text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>

            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>We collect information you provide directly to us, such as when you:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Create or update your account</li>
                  <li>Post content, comments, or reviews</li>
                  <li>Book appointments with salons</li>
                  <li>Communicate with us or other users</li>
                  <li>Participate in surveys or promotions</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Communicate with you about products, services, and events</li>
                  <li>Monitor and analyze trends and usage</li>
                  <li>Personalize and improve your experience</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>We may share your information in the following situations:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>With your consent or at your direction</li>
                  <li>With salon partners when you book appointments</li>
                  <li>With service providers who perform services on our behalf</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and prevent fraud</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Your Rights and Choices</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Access and update your personal information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt out of marketing communications</li>
                  <li>Control privacy settings for your posts</li>
                  <li>Request a copy of your data</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your own. We ensure that such transfers are subject to appropriate safeguards in accordance with applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Changes to Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
              <div className="text-muted-foreground">
                <p>If you have any questions about this Privacy Policy, please contact us at:</p>
                <div className="mt-3 space-y-1">
                  <p>Email: privacy@nstyle.app</p>
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

export default PrivacyPolicy;