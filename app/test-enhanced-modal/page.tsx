'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  EnhancedAsyncButton,
  EnhancedLoginButton,
  EnhancedSaveButton,
  EnhancedDeleteButton,
  EnhancedSubmitButton,
  AsyncState
} from '@/components/ui/EnhancedAsyncButton';
import {
  EnhancedModal,
  ProfileEditModal,
  SettingsModal,
  DeleteConfirmationModal,
  NotificationModal,
  ModalSection,
  ModalIconType
} from '@/components/ui/EnhancedModal';
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  Database, 
  Users,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Edit3,
  Plus,
  Check,
  X,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TestEnhancedModalPage() {
  // State for different modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
  
  // Form states
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-234-567-8900',
    bio: 'Software engineer passionate about creating amazing user experiences.',
    location: 'San Francisco, CA',
    company: 'Tech Corp',
    website: 'https://johndoe.dev',
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false
    }
  });

  const [settingsData, setSettingsData] = useState({
    theme: 'system',
    language: 'en',
    currency: 'USD',
    timezone: 'America/New_York',
    privacy: {
      profileVisibility: 'public',
      dataCollection: true,
      analytics: true
    },
    preferences: {
      autoSave: true,
      compactMode: false,
      showAnimations: true
    }
  });

  // Enhanced async operation handlers
  const handleProfileSave = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Profile saved:', profileData);
    // In a real app, you might update the UI or show success state
  };

  const handleSettingsSave = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Settings saved:', settingsData);
  };

  const handleDeleteItem = async () => {
    // Simulate deletion
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Item deleted successfully');
  };

  const handleNotificationAction = async () => {
    // Simulate notification action
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('Notification action completed');
  };

  // Enhanced async button handlers with different scenarios
  const handleAsyncSuccess = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Async operation completed successfully');
  };

  const handleAsyncError = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    throw new Error('Simulated network error - please try again');
  };

  const handleAsyncTimeout = async () => {
    // Long operation that will timeout
    await new Promise(resolve => setTimeout(resolve, 35000));
    console.log('This should not execute due to timeout');
  };

  const handleAsyncRetry = async () => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    console.log('Retry operation succeeded');
  };

  // Modal sections for advanced demo
  const getAdvancedModalSections = (): ModalSection[] => [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Basic profile details and contact information',
      icon: <User className="h-4 w-4" />,
      collapsible: true,
      defaultOpen: true,
      children: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                placeholder="Enter your last name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              placeholder="Enter your email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={profileData.phone}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              placeholder="Enter your phone number"
            />
          </div>
        </div>
      )
    },
    {
      id: 'bio',
      title: 'Professional Profile',
      description: 'Additional information about your professional background',
      icon: <Briefcase className="h-4 w-4" />,
      collapsible: true,
      defaultOpen: false,
      children: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={profileData.company}
              onChange={(e) => setProfileData({...profileData, company: e.target.value})}
              placeholder="Your company name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={profileData.location}
              onChange={(e) => setProfileData({...profileData, location: e.target.value})}
              placeholder="Your location"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={profileData.website}
              onChange={(e) => setProfileData({...profileData, website: e.target.value})}
              placeholder="Your website URL"
            />
          </div>
        </div>
      )
    },
    {
      id: 'preferences',
      title: 'Preferences & Notifications',
      description: 'Customize your experience and notification settings',
      icon: <Bell className="h-4 w-4" />,
      collapsible: true,
      defaultOpen: false,
      children: (
        <div className="space-y-4">
          <div className="space-y-4">
            <h4 className="font-medium">Notification Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={profileData.notifications.email}
                  onCheckedChange={(checked) => 
                    setProfileData({
                      ...profileData,
                      notifications: {...profileData.notifications, email: checked}
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <Switch
                  id="push-notifications"
                  checked={profileData.notifications.push}
                  onCheckedChange={(checked) => 
                    setProfileData({
                      ...profileData,
                      notifications: {...profileData.notifications, push: checked}
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <Switch
                  id="sms-notifications"
                  checked={profileData.notifications.sms}
                  onCheckedChange={(checked) => 
                    setProfileData({
                      ...profileData,
                      notifications: {...profileData.notifications, sms: checked}
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="marketing-notifications">Marketing Communications</Label>
                <Switch
                  id="marketing-notifications"
                  checked={profileData.notifications.marketing}
                  onCheckedChange={(checked) => 
                    setProfileData({
                      ...profileData,
                      notifications: {...profileData.notifications, marketing: checked}
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Enhanced AsyncButton & Modal Testing</h1>
        <p className="text-muted-foreground">
          Comprehensive testing suite for enhanced components with various scenarios, animations, and error handling.
        </p>
      </div>

      <Tabs defaultValue="async-buttons" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="async-buttons">AsyncButton Variants</TabsTrigger>
          <TabsTrigger value="modal-scenarios">Modal Scenarios</TabsTrigger>
          <TabsTrigger value="advanced-features">Advanced Features</TabsTrigger>
        </TabsList>

        {/* AsyncButton Testing */}
        <TabsContent value="async-buttons" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Basic AsyncButton Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Async Operations</CardTitle>
                <CardDescription>Test different async button states and behaviors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <EnhancedAsyncButton
                    onClick={handleAsyncSuccess}
                    loadingText="Processing..."
                    successText="Completed!"
                    variant="default"
                    size="sm"
                  >
                    Success Demo
                  </EnhancedAsyncButton>
                  
                  <EnhancedAsyncButton
                    onClick={handleAsyncError}
                    loadingText="Processing..."
                    errorText="Failed!"
                    successText="Success!"
                    enableRetry={true}
                    variant="outline"
                    size="sm"
                  >
                    Error Demo
                  </EnhancedAsyncButton>
                  
                  <EnhancedAsyncButton
                    onClick={handleAsyncTimeout}
                    loadingText="Processing..."
                    successText="Success!"
                    timeoutDuration={5000}
                    enableRetry={false}
                    variant="secondary"
                    size="sm"
                  >
                    Timeout Demo
                  </EnhancedAsyncButton>
                  
                  <EnhancedAsyncButton
                    onClick={handleAsyncRetry}
                    loadingText="Processing..."
                    successText="Retry Success!"
                    enableRetry={true}
                    showErrorBriefly={false}
                    variant="ghost"
                    size="sm"
                  >
                    Retry Demo
                  </EnhancedAsyncButton>
                </div>
              </CardContent>
            </Card>

            {/* Pre-configured Button Variants */}
            <Card>
              <CardHeader>
                <CardTitle>Pre-configured Variants</CardTitle>
                <CardDescription>Ready-to-use button components for common operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <EnhancedLoginButton onClick={handleAsyncSuccess} size="sm">
                    Login
                  </EnhancedLoginButton>
                  
                  <EnhancedSaveButton onClick={handleAsyncSuccess} size="sm">
                    Save Changes
                  </EnhancedSaveButton>
                  
                  <EnhancedDeleteButton onClick={handleAsyncError} size="sm">
                    Delete Item
                  </EnhancedDeleteButton>
                  
                  <EnhancedSubmitButton onClick={handleAsyncSuccess} size="sm">
                    Submit Form
                  </EnhancedSubmitButton>
                </div>
              </CardContent>
            </Card>

            {/* Button States Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Button States & Animations</CardTitle>
                <CardDescription>Visual demonstration of different button states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="text-center space-y-2">
                    <EnhancedAsyncButton
                      onClick={() => new Promise(resolve => setTimeout(resolve, 2000))}
                      stateClasses={{
                        success: "animate-pulse"
                      }}
                    >
                      Loading with Pulse
                    </EnhancedAsyncButton>
                    <p className="text-xs text-muted-foreground">Success State with Animation</p>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <EnhancedAsyncButton
                      onClick={() => new Promise((_, reject) => setTimeout(() => reject(new Error('Demo error')), 1000))}
                      stateClasses={{
                        error: "animate-bounce"
                      }}
                    >
                      Error with Bounce
                    </EnhancedAsyncButton>
                    <p className="text-xs text-muted-foreground">Error State with Animation</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Callback Testing */}
            <Card>
              <CardHeader>
                <CardTitle>Callback Handlers</CardTitle>
                <CardDescription>Test enhanced callback functionality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <EnhancedAsyncButton
                  onClick={handleAsyncSuccess}
                  callbacks={{
                    onSuccess: () => console.log('Success callback triggered!'),
                    onError: (error) => console.error('Error callback triggered:', error),
                    onStateChange: (state, previousState) => 
                      console.log(`State changed: ${previousState} -> ${state}`)
                  }}
                  loadingText="Testing Callbacks..."
                  successText="Callbacks Work!"
                >
                  Test Callbacks
                </EnhancedAsyncButton>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Modal Scenarios */}
        <TabsContent value="modal-scenarios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Profile Edit Modal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Edit Modal
                </CardTitle>
                <CardDescription>Test structured modal with collapsible sections</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setProfileModalOpen(true)}
                  className="w-full"
                  variant="outline"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Settings Modal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings Modal
                </CardTitle>
                <CardDescription>Test large modal with multiple settings sections</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setSettingsModalOpen(true)}
                  className="w-full"
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Open Settings
                </Button>
              </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Delete Confirmation
                </CardTitle>
                <CardDescription>Test destructive action modal with confirmation</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setDeleteModalOpen(true)}
                  className="w-full"
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Item
                </Button>
              </CardContent>
            </Card>

            {/* Notification Modal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Modal
                </CardTitle>
                <CardDescription>Test informational modal with custom actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setNotificationModalOpen(true)}
                  className="w-full"
                  variant="outline"
                >
                  <Info className="h-4 w-4 mr-2" />
                  Show Notification
                </Button>
              </CardContent>
            </Card>

            {/* Advanced Modal Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Advanced Modal
                </CardTitle>
                <CardDescription>Test modal with animations, icons, and complex content</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setAdvancedModalOpen(true)}
                  className="w-full"
                  variant="default"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Advanced Demo
                </Button>
              </CardContent>
            </Card>

            {/* Modal Size Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Modal Sizes</CardTitle>
                <CardDescription>Test different modal sizes and layouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => setNotificationModalOpen(true)}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  Small Modal
                </Button>
                <Button 
                  onClick={() => setProfileModalOpen(true)}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  Medium Modal
                </Button>
                <Button 
                  onClick={() => setSettingsModalOpen(true)}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  Large Modal
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Features */}
        <TabsContent value="advanced-features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Animation Testing */}
            <Card>
              <CardHeader>
                <CardTitle>Modal Animations</CardTitle>
                <CardDescription>Test different entrance animations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => setNotificationModalOpen(true)}
                    variant="outline"
                    size="sm"
                  >
                    Fade Animation
                  </Button>
                  <Button 
                    onClick={() => setProfileModalOpen(true)}
                    variant="outline"
                    size="sm"
                  >
                    Slide Animation
                  </Button>
                  <Button 
                    onClick={() => setSettingsModalOpen(true)}
                    variant="outline"
                    size="sm"
                  >
                    Zoom Animation
                  </Button>
                  <Button 
                    onClick={() => setAdvancedModalOpen(true)}
                    variant="outline"
                    size="sm"
                  >
                    Bounce Animation
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Icon Testing */}
            <Card>
              <CardHeader>
                <CardTitle>Modal Icons</CardTitle>
                <CardDescription>Test different icon types and animations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: 'user', label: 'User' },
                    { icon: 'settings', label: 'Settings' },
                    { icon: 'shield', label: 'Security' },
                    { icon: 'mail', label: 'Email' },
                    { icon: 'phone', label: 'Phone' },
                    { icon: 'alert', label: 'Alert' }
                  ].map(({ icon, label }) => (
                    <Button
                      key={icon}
                      onClick={() => setNotificationModalOpen(true)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Form Validation Demo */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Form Validation & Error Handling</CardTitle>
                <CardDescription>Test modal form validation with different error scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <EnhancedAsyncButton
                    onClick={() => new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Validation failed: Email is required')), 1000)
                    )}
                    loadingText="Validating..."
                    errorText="Validation Failed"
                    enableRetry={true}
                    callbacks={{
                      onError: (error) => console.log('Form validation error:', error.message)
                    }}
                  >
                    Validation Error
                  </EnhancedAsyncButton>
                  
                  <EnhancedAsyncButton
                    onClick={() => new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Network timeout - please check your connection')), 5000)
                    )}
                    loadingText="Submitting..."
                    errorText="Network Error"
                    timeoutDuration={3000}
                    enableRetry={true}
                  >
                    Network Error
                  </EnhancedAsyncButton>
                  
                  <EnhancedAsyncButton
                    onClick={() => new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Permission denied - you do not have access')), 800)
                    )}
                    loadingText="Processing..."
                    errorText="Permission Denied"
                    enableRetry={false}
                    callbacks={{
                      onError: (error) => console.error('Permission error:', error.message)
                    }}
                  >
                    Permission Error
                  </EnhancedAsyncButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      
      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        onSubmit={handleProfileSave}
        size="lg"
        sections={getAdvancedModalSections()}
        submitText="Save Profile"
        cancelText="Cancel"
        autoCloseDuration={2000}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        onSubmit={handleSettingsSave}
        size="xl"
        submitText="Save Settings"
        cancelText="Cancel"
        autoCloseDuration={1500}
        animation="slide"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onSubmit={handleDeleteItem}
        itemName="User Account"
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notificationModalOpen}
        onOpenChange={setNotificationModalOpen}
        title="System Notification"
        description="This is a test notification to demonstrate the notification modal functionality with custom actions."
      />

      {/* Advanced Modal */}
      <EnhancedModal
        isOpen={advancedModalOpen}
        onOpenChange={setAdvancedModalOpen}
        title="Advanced Modal Demo"
        description="This is a comprehensive demonstration of the Enhanced Modal with all features enabled including animations, icons, sections, and custom actions."
        icon="user"
        size="xl"
        animation="bounce"
        showAnimatedIcon={true}
        onSubmit={handleProfileSave}
        submitText="Save All Changes"
        cancelText="Cancel"
        autoCloseDuration={2000}
        sections={getAdvancedModalSections()}
        customActions={[
          <Button key="export" variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>,
          <Button key="import" variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </Button>,
          <Button key="reset" variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        ]}
      />
    </div>
  );
}