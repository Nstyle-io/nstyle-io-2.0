import { useState } from 'react';
import { ArrowLeft, Search, ChevronRight, MessageCircle, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    {
      title: 'Getting Started',
      icon: '🚀',
      articles: [
        'How to create an account',
        'Setting up your profile',
        'Finding salons near you',
        'Understanding the app interface'
      ]
    },
    {
      title: 'Booking Appointments',
      icon: '📅',
      articles: [
        'How to book an appointment',
        'Cancelling or rescheduling',
        'Payment methods',
        'What to expect at your appointment'
      ]
    },
    {
      title: 'Social Features',
      icon: '👥',
      articles: [
        'Following other users',
        'Posting your nail art',
        'Using hashtags effectively',
        'Privacy settings'
      ]
    },
    {
      title: 'For Salon Owners',
      icon: '💼',
      articles: [
        'Creating a business profile',
        'Managing appointments',
        'Setting up services and pricing',
        'Analytics and insights'
      ]
    }
  ];

  const faqs = [
    {
      question: 'How do I book an appointment?',
      answer: 'To book an appointment, find a salon on the Discover page, view their profile, and tap "Book Appointment". Select your preferred service, date, and time, then confirm your booking.'
    },
    {
      question: 'Can I cancel or reschedule my appointment?',
      answer: 'Yes, you can cancel or reschedule your appointment up to 24 hours before the scheduled time. Go to your profile, find the appointment under "Upcoming Bookings", and select the cancel or reschedule option.'
    },
    {
      question: 'How do I make my account private?',
      answer: 'Go to Settings > Privacy & Security, then toggle on "Private Account". When your account is private, only approved followers can see your posts and profile information.'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept all major credit cards, debit cards, and digital payment methods like Apple Pay and Google Pay. Payment is processed securely through our platform.'
    },
    {
      question: 'How do I report inappropriate content?',
      answer: 'Tap the three dots menu on any post and select "Report". Choose the reason for reporting and submit. Our team will review and take appropriate action within 24 hours.'
    },
    {
      question: 'Can salon owners manage multiple locations?',
      answer: 'Yes, business accounts can manage multiple salon locations. Each location can have its own services, staff, and booking calendar while being managed from a single account.'
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-2xl font-bold">Help Center</h1>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help articles..."
              className="pl-10 glass-card"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-6 rounded-2xl text-center">
              <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get instant help from our support team
              </p>
              <Button size="sm" className="w-full">Start Chat</Button>
            </div>

            <div className="glass-card p-6 rounded-2xl text-center">
              <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Send us a detailed message
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Send Email
              </Button>
            </div>

            <div className="glass-card p-6 rounded-2xl text-center">
              <Phone className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Phone Support</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Call us during business hours
              </p>
              <Button variant="outline" size="sm" className="w-full">
                (555) 123-4567
              </Button>
            </div>
          </div>

          {/* Help Categories */}
          {!searchQuery && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {helpCategories.map((category, index) => (
                  <div key={index} className="glass-card p-4 rounded-2xl">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{category.title}</h3>
                        <div className="space-y-2">
                          {category.articles.map((article, articleIndex) => (
                            <div
                              key={articleIndex}
                              className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <span>{article}</span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {searchQuery ? 'Search Results' : 'Frequently Asked Questions'}
            </h2>
            
            {filteredFAQs.length > 0 ? (
              <div className="glass-card rounded-2xl overflow-hidden">
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ) : (
              <div className="glass-card p-8 rounded-2xl text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or browse our help categories above.
                </p>
              </div>
            )}
          </div>

          {/* Still Need Help */}
          <div className="mt-8 glass-card p-6 rounded-2xl text-center">
            <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? Our support team is here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button>Contact Support</Button>
              <Button variant="outline">Submit Feedback</Button>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default HelpCenter;