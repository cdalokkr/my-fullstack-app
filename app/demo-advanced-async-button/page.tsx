"use client";

import React, { useState, useCallback } from 'react';
import { AdvancedAsyncButton, AdvancedLoginButton, AdvancedSaveButton, AdvancedDeleteButton, AdvancedSubmitButton } from '@/components/ui/advanced-async-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Loader2, Clock, Zap } from 'lucide-react';

export default function AdvancedAsyncButtonDemo() {
  const [result, setResult] = useState<string>('');
  const [counter, setCounter] = useState(0);

  // Demo handlers
  const handleQuickOperation = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    setResult('Quick operation completed successfully!');
  }, []);

  const handleMediumOperation = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    setResult('Medium operation completed with progress tracking!');
  }, []);

  const handleLongOperation = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 8000));
    setResult('Long operation completed with timeout protection!');
  }, []);

  const handleFailingOperation = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    throw new Error('Operation failed intentionally for demo');
  }, []);

  const handleBatchOperation = useCallback(async () => {
    for (let i = 0; i < 5; i++) {
      setCounter(i + 1);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setResult(`Batch operation completed! Processed ${counter} items.`);
  }, [counter]);

  const handleLogin = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 2500));
    setResult('Login successful! Redirecting to dashboard...');
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Advanced Async Button Component</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          A comprehensive async button with smooth motion effects, state management, 
          accessibility features, and extensive customization options.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="secondary">🎨 Smooth Animations</Badge>
          <Badge variant="secondary">♿ Accessible</Badge>
          <Badge variant="secondary">⚡ Performance Optimized</Badge>
          <Badge variant="secondary">🔧 Highly Customizable</Badge>
          <Badge variant="secondary">🧪 Well Tested</Badge>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Usage</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Features</TabsTrigger>
          <TabsTrigger value="variants">Pre-configured</TabsTrigger>
          <TabsTrigger value="states">State Management</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Operation
                </CardTitle>
                <CardDescription>Fast operation with success feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AdvancedAsyncButton
                  onClick={handleQuickOperation}
                  initialText="Start Quick Task"
                  loadingText="Processing..."
                  successText="Task completed!"
                  errorText="Task failed"
                  successDuration={2000}
                  variant="primary"
                  size="md"
                />
                <p className="text-sm text-muted-foreground">1.5 second operation with visual feedback</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Long Operation
                </CardTitle>
                <CardDescription>Progress tracking and timeout protection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AdvancedAsyncButton
                  onClick={handleLongOperation}
                  initialText="Process Data"
                  loadingText="Processing large dataset..."
                  successText="Data processed!"
                  errorText="Processing failed"
                  successDuration={3000}
                  timeoutDuration={10000}
                  showProgress={true}
                  progressDuration={3000}
                  variant="secondary"
                  size="md"
                />
                <p className="text-sm text-muted-foreground">8 second operation with progress bar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Error Handling
                </CardTitle>
                <CardDescription>Demonstrates error state and retry</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AdvancedAsyncButton
                  onClick={handleFailingOperation}
                  initialText="Risky Operation"
                  loadingText="Attempting operation..."
                  successText="Success!"
                  errorText="Operation failed"
                  successDuration={2000}
                  enableRetry={true}
                  variant="danger"
                  size="md"
                />
                <p className="text-sm text-muted-foreground">Fails intentionally to show error handling</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Loading Dots Animation</CardTitle>
                <CardDescription>Enhanced loading state with animated dots</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AdvancedAsyncButton
                  onClick={handleMediumOperation}
                  initialText="Download File"
                  loadingText="Downloading"
                  successText="Download complete!"
                  showLoadingDots={true}
                  showProgress={true}
                  progressDuration={2000}
                  variant="primary"
                  preset="subtle"
                />
                <p className="text-sm text-muted-foreground">Shows animated loading dots</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Micro-interactions</CardTitle>
                <CardDescription>Hover, tap, and focus effects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AdvancedAsyncButton
                  onClick={handleQuickOperation}
                  initialText="Interactive Button"
                  loadingText="Working..."
                  successText="Done!"
                  microInteractions={{
                    hover: true,
                    tap: true,
                    focus: true
                  }}
                  preset="dramatic"
                  variant="success"
                />
                <p className="text-sm text-muted-foreground">Try hovering and clicking for effects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Batch Processing</CardTitle>
                <CardDescription>Multiple operations with state tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AdvancedAsyncButton
                  onClick={handleBatchOperation}
                  initialText={`Process ${counter} items`}
                  loadingText="Processing batch..."
                  successText="Batch complete!"
                  showProgress={true}
                  progressDuration={3000}
                  variant="warning"
                  size="lg"
                />
                <p className="text-sm text-muted-foreground">Processing multiple items with progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Styling</CardTitle>
                <CardDescription>Custom variants and sizes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <AdvancedAsyncButton
                    onClick={handleQuickOperation}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    Ghost Small
                  </AdvancedAsyncButton>
                  <AdvancedAsyncButton
                    onClick={handleQuickOperation}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    Outline Large
                  </AdvancedAsyncButton>
                </div>
                <p className="text-sm text-muted-foreground">Custom variants and sizes</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="variants" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pre-configured Login Button</CardTitle>
                <CardDescription>Authentication flow with proper timing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AdvancedLoginButton
                  onClick={handleLogin}
                  onSuccess={() => {
                    setResult('Login successful! Redirecting...');
                  }}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Optimized for authentication flows</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pre-configured Save Button</CardTitle>
                <CardDescription>Form saving with progress tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AdvancedSaveButton
                  onClick={handleQuickOperation}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Optimized for form submissions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pre-configured Delete Button</CardTitle>
                <CardDescription>Destructive actions with confirmation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AdvancedDeleteButton
                  onClick={handleFailingOperation}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Includes retry functionality</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pre-configured Submit Button</CardTitle>
                <CardDescription>Form submission with feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AdvancedSubmitButton
                  onClick={handleMediumOperation}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Optimized for form submissions</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="states" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>State Management Demo</CardTitle>
              <CardDescription>Real-time state tracking and callbacks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdvancedAsyncButton
                  onClick={handleQuickOperation}
                  initialText="Test State Changes"
                  loadingText="Processing..."
                  successText="Success!"
                  errorText="Failed"
                  onStateChange={(state, previous) => {
                    console.log(`State changed: ${previous} → ${state}`);
                    setResult(`State: ${previous} → ${state}`);
                  }}
                  onSuccess={() => setResult('Operation completed successfully!')}
                  onError={(error) => setResult(`Operation failed: ${error.message}`)}
                  variant="primary"
                  size="lg"
                />
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Current State:</h4>
                  <p className="text-sm text-muted-foreground">{result || 'No operation performed yet'}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Available States:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>idle</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                    <span>loading</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>success</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>error</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <span>paused</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span>retrying</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Component Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">Animation Features</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Smooth background transitions</li>
                <li>• Text enter/exit animations</li>
                <li>• Icon rotation and scaling</li>
                <li>• Micro-interactions (hover, tap)</li>
                <li>• Reduced motion support</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">State Management</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 6 distinct states</li>
                <li>• Auto-reset functionality</li>
                <li>• Timeout handling</li>
                <li>• Pause/resume operations</li>
                <li>• Retry failed operations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Accessibility</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• ARIA attributes</li>
                <li>• Screen reader support</li>
                <li>• Keyboard navigation</li>
                <li>• Live region announcements</li>
                <li>• Focus management</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}