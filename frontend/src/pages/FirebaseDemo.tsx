import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { FirebaseAuthButton } from '@/components/firebase/FirebaseAuthButton';
import { BackendSwitcher } from '@/components/admin/BackendSwitcher';
import { 
  FirestoreService, 
  FirebaseStorageService, 
  FirebaseAnalyticsService 
} from '@/integrations/firebase';

export default function FirebaseDemo() {
  const [firestoreData, setFirestoreData] = useState('');
  const [collectionName, setCollectionName] = useState('test-collection');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  // Firestore Demo Functions
  const addToFirestore = async () => {
    if (!firestoreData.trim()) return;
    
    const result = await FirestoreService.addDocument(collectionName, {
      message: firestoreData,
      timestamp: new Date(),
      user: 'demo-user'
    });

    if (result.error) {
      toast({
        title: "Firestore Error",
        description: result.error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `Document added with ID: ${result.id}`
      });
      setFirestoreData('');
    }
  };

  const readFromFirestore = async () => {
    const result = await FirestoreService.getDocuments(collectionName, [
      FirestoreService.orderByField('timestamp', 'desc'),
      FirestoreService.limitResults(5)
    ]);

    if (result.error) {
      toast({
        title: "Firestore Error",
        description: result.error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Firestore Data",
        description: `Found ${result.data.length} documents`,
      });
      console.log('Firestore data:', result.data);
    }
  };

  // Storage Demo Functions
  const handleFileUpload = async () => {
    if (!uploadFile) return;

    const path = `demo-uploads/${Date.now()}-${uploadFile.name}`;
    
    try {
      const result = await FirebaseStorageService.uploadFileWithProgress(
        path, 
        uploadFile,
        (progress) => setUploadProgress(progress)
      ) as any;

      if (result.error) {
        toast({
          title: "Upload Error",
          description: result.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Upload Success",
          description: `File uploaded: ${result.url}`,
        });
        setUploadFile(null);
        setUploadProgress(0);
      }
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.error || 'Upload failed',
        variant: "destructive"
      });
    }
  };

  // Analytics Demo Functions
  const trackCustomEvent = () => {
    FirebaseAnalyticsService.logEvent('demo_button_click', {
      button_name: 'custom_event_demo',
      page: 'firebase_demo'
    });
    
    toast({
      title: "Analytics Event Tracked",
      description: "Custom event sent to Firebase Analytics"
    });
  };

  const trackPageView = () => {
    FirebaseAnalyticsService.trackPageView('firebase_demo', 'Firebase Demo Page');
    
    toast({
      title: "Page View Tracked",
      description: "Page view sent to Firebase Analytics"
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Firebase Integration Demo</h1>
        <p className="text-muted-foreground mb-8">
          Test Firebase Authentication, Firestore, Storage, and Analytics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend Switcher */}
        <BackendSwitcher />

        {/* Firebase Authentication */}
        <FirebaseAuthButton />

        {/* Firestore Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Firestore Database</CardTitle>
            <CardDescription>Add and read data from Firestore</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Collection name"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
            />
            <Input
              placeholder="Enter some data to store"
              value={firestoreData}
              onChange={(e) => setFirestoreData(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={addToFirestore} className="flex-1">
                Add to Firestore
              </Button>
              <Button onClick={readFromFirestore} variant="outline" className="flex-1">
                Read from Firestore
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Firebase Storage Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Firebase Storage</CardTitle>
            <CardDescription>Upload files to Firebase Storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <Button 
              onClick={handleFileUpload} 
              disabled={!uploadFile}
              className="w-full"
            >
              Upload to Firebase Storage
            </Button>
          </CardContent>
        </Card>

        {/* Firebase Analytics Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Firebase Analytics</CardTitle>
            <CardDescription>Track events and page views</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={trackCustomEvent} className="w-full">
              Track Custom Event
            </Button>
            <Button onClick={trackPageView} variant="outline" className="w-full">
              Track Page View
            </Button>
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>Firebase and Supabase coexistence status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Firebase Features</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ Authentication</li>
                  <li>✅ Firestore Database</li>
                  <li>✅ Cloud Storage</li>
                  <li>✅ Analytics</li>
                  <li>✅ Real-time Updates</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Supabase Features</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✅ PostgreSQL Database</li>
                  <li>✅ Authentication</li>
                  <li>✅ Row Level Security</li>
                  <li>✅ Edge Functions</li>
                  <li>✅ Storage</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}