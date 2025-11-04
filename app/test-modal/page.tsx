'use client';

import React, { useState } from 'react';
import { SimpleModal } from '@/components/ui/SimpleModal';
import { SimpleAsyncButton } from '@/components/ui/SimpleAsyncButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Users, Send, Save, Loader2 } from 'lucide-react';

interface TestFormData {
  name: string;
  email: string;
  message: string;
  category: string;
  agree: boolean;
}

export default function TestModalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<TestFormData>({
    name: '',
    email: '',
    message: '',
    category: '',
    agree: false,
  });
  const [submittedData, setSubmittedData] = useState<TestFormData[]>([]);

  // Mock async operations for demonstration
  const simulateAsyncOperation = async (duration: number = 2000): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(resolve, duration);
    });
  };

  const simulateFormSubmit = async (): Promise<void> => {
    await simulateAsyncOperation(2000);
    console.log('Form submitted:', formData);
    
    // Store the submitted data
    setSubmittedData(prev => [...prev, { ...formData }]);
    
    // Simulate potential errors (uncomment to test error handling)
    // if (Math.random() < 0.3) {
    //   throw new Error('Random submission error');
    // }
  };

  const simulateUserCreation = async (): Promise<void> => {
    await simulateAsyncOperation(1500);
    console.log('User created:', formData.name);
    
    // Store the submitted data
    setSubmittedData(prev => [...prev, { ...formData }]);
    
    // Simulate potential errors
    // if (!formData.name || !formData.email) {
    //   throw new Error('Name and email are required');
    // }
  };

  const handleInputChange = (field: keyof TestFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      message: '',
      category: '',
      agree: false,
    });
  };

  const clearSubmissions = () => {
    setSubmittedData([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Simple Async Button & Modal Test Page
          </h1>
          <p className="text-gray-600">
            Test the SimpleAsyncButton and SimpleModal components with various async operations
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Async Button Tests
              </CardTitle>
              <CardDescription>
                Test different async button variants and states
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Basic Async Operations</h4>
                
                <SimpleAsyncButton
                  onClick={() => simulateAsyncOperation(1000)}
                  variant="default"
                  className="w-full"
                >
                  Quick Save (1s)
                </SimpleAsyncButton>

                <SimpleAsyncButton
                  onClick={() => simulateAsyncOperation(3000)}
                  loadingText="Processing..."
                  successText="Completed!"
                  variant="outline"
                  className="w-full"
                >
                  Long Process (3s)
                </SimpleAsyncButton>

                <SimpleAsyncButton
                  onClick={() => simulateAsyncOperation(1500)}
                  loadingText="Creating user..."
                  successText="User created!"
                  successDuration={2000}
                  variant="secondary"
                  className="w-full"
                >
                  Create User
                </SimpleAsyncButton>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Different Variants</h4>
                
                <SimpleAsyncButton
                  onClick={() => simulateAsyncOperation(1000)}
                  loadingText="Deleting..."
                  successText="Deleted!"
                  variant="destructive"
                  className="w-full"
                >
                  Delete Item
                </SimpleAsyncButton>

                <SimpleAsyncButton
                  onClick={() => simulateAsyncOperation(2000)}
                  loadingText="Uploading..."
                  successText="Uploaded!"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  Upload File
                </SimpleAsyncButton>

                <SimpleAsyncButton
                  onClick={() => simulateAsyncOperation(800)}
                  loadingText="Syncing..."
                  successText="Synced!"
                  variant="link"
                  size="lg"
                  className="w-full"
                >
                  Sync Data
                </SimpleAsyncButton>
              </div>
            </CardContent>
          </Card>

          {/* Modal Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Modal Integration Test
              </CardTitle>
              <CardDescription>
                Test modal with form submission and auto-close
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SimpleAsyncButton
                onClick={() => setIsModalOpen(true)}
                loadingText="Opening modal..."
                successText="Modal opened!"
                variant="outline"
                className="w-full"
              >
                Open Test Modal
              </SimpleAsyncButton>

              <Separator />

              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Modal Features:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Auto-close after successful submission (1.5s)</li>
                  <li>Form validation and reset</li>
                  <li>Multiple submit button variants</li>
                  <li>Backdrop click prevention during submission</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submitted Data Display */}
        {submittedData.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Submitted Data ({submittedData.length})</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSubmissions}
                >
                  Clear All
                </Button>
              </div>
              <CardDescription>
                Data submitted through the modal form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submittedData.map((data, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Name:</strong> {data.name || 'Not provided'}
                      </div>
                      <div>
                        <strong>Email:</strong> {data.email || 'Not provided'}
                      </div>
                      <div>
                        <strong>Category:</strong> {data.category || 'Not selected'}
                      </div>
                      <div>
                        <strong>Agreed:</strong> {data.agree ? 'Yes' : 'No'}
                      </div>
                    </div>
                    {data.message && (
                      <div className="mt-2">
                        <strong>Message:</strong>
                        <p className="mt-1 text-gray-600">{data.message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Test Modal */}
      <SimpleModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Add New User"
        description="Fill out the form to add a new user to the system"
        submitText="Create User"
        submitLoadingText="Creating user..."
        submitSuccessText="User created!"
        autoCloseDuration={1500}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                disabled={isModalOpen && false} // Simulate form disabled state during submission
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                disabled={false}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="user">Regular User</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Additional Notes</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Enter any additional notes or comments"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="agree"
              checked={formData.agree}
              onCheckedChange={(checked) => handleInputChange('agree', checked as boolean)}
            />
            <Label htmlFor="agree" className="text-sm font-normal">
              I agree to the terms and conditions *
            </Label>
          </div>

          {/* Form validation display */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Required fields: Name, Email, Agreement</p>
            <p>Validation status: {
              formData.name && formData.email && formData.agree 
                ? '✅ All required fields completed' 
                : '❌ Please complete required fields'
            }</p>
          </div>

          {/* Additional submit buttons for testing */}
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Alternative Actions:</p>
            <div className="flex gap-2">
              <SimpleAsyncButton
                onClick={simulateFormSubmit}
                loadingText="Saving..."
                successText="Saved!"
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Save Draft
              </SimpleAsyncButton>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetForm}
                className="flex-1"
              >
                Reset Form
              </Button>
            </div>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}