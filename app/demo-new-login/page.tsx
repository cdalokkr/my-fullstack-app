'use client'

import { useState } from 'react'
import { NewLoginForm } from '@/components/auth/new-login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { LoginButton } from '@/components/ui/async-button'
import { CheckCircle, AlertCircle, Info, Zap, Shield, Smartphone, Play, Settings } from 'lucide-react'

export default function DemoNewLoginPage() {
  const [activeDemo, setActiveDemo] = useState('form')
  const [testResults, setTestResults] = useState<{[key: string]: 'success' | 'error' | 'loading' | 'idle'}>({})

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Real-time Validation',
      description: 'Instant feedback as you type with Zod schema validation'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Enhanced Security',
      description: 'Password strength requirements and granular error handling'
    },
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: 'Responsive Design',
      description: 'Works seamlessly across all devices and screen sizes'
    }
  ]

  const testCredentials = [
    { email: 'admin@example.com', password: 'Admin123!', expected: 'Admin Dashboard', role: 'admin' },
    { email: 'user@example.com', password: 'UserPass123!', expected: 'User Dashboard', role: 'user' },
    { email: 'invalid@test.com', password: 'wrongpass', expected: 'Invalid Credentials Error', role: 'error' },
  ]

  // Simulate async login for testing
  const simulateLogin = async (role: string): Promise<void> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (role === 'error') {
      throw new Error('Invalid credentials')
    }
    
    // Simulate successful login
    console.log(`Simulated login successful for role: ${role}`)
    return Promise.resolve()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-4xl font-bold tracking-tight">New Login Form Demo</h1>
            <Badge variant="secondary" className="text-sm">Live Preview</Badge>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Test the modernized login form with React Hook Form, Zod validation, and enhanced error handling
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="flex justify-center text-primary mb-3">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demo Tabs */}
        <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="form">Login Form</TabsTrigger>
            <TabsTrigger value="async-test">Async-Button Test</TabsTrigger>
            <TabsTrigger value="features">Features & Validation</TabsTrigger>
            <TabsTrigger value="instructions">Setup Instructions</TabsTrigger>
          </TabsList>

          {/* Login Form Tab */}
          <TabsContent value="form" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Form Demo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Live Form Demo
                  </CardTitle>
                  <CardDescription>
                    Try the new login form with real-time validation and enhanced error handling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NewLoginForm />
                </CardContent>
              </Card>

              {/* Test Credentials */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Credentials</CardTitle>
                  <CardDescription>
                    Use these credentials to test different scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {testCredentials.map((cred, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-2">
                        <div className="font-mono text-sm">
                          <div><strong>Email:</strong> {cred.email}</div>
                          <div><strong>Password:</strong> {cred.password}</div>
                          <div><strong>Expected:</strong> {cred.expected}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Pre-fill form logic would go here
                            console.log(`Testing: ${cred.email}`)
                          }}
                        >
                          Test This Account
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Demo Mode</AlertTitle>
                    <AlertDescription>
                      This is a demonstration. In production, the form will connect to your authentication system.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Async-Button Test Tab */}
          <TabsContent value="async-test" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-blue-500" />
                    Async-Button Success Test
                  </CardTitle>
                  <CardDescription>
                    Test the LoginButton component with different scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Settings className="h-4 w-4" />
                    <AlertTitle>Test Mode</AlertTitle>
                    <AlertDescription>
                      These buttons simulate login behavior with async states. Click to see the loading, success, and reset flow.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Successful Login Tests</h4>
                      
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <div className="font-mono text-sm mb-2">
                            <div><strong>Email:</strong> admin@example.com</div>
                            <div><strong>Password:</strong> Admin123!</div>
                            <div><strong>Expected:</strong> Admin Dashboard</div>
                          </div>
                          <LoginButton
                            onClick={() => simulateLogin('admin')}
                            successDuration={3000}
                            className="w-full"
                          >
                            Test Admin Login
                          </LoginButton>
                        </div>
                        
                        <div className="p-3 border rounded-lg">
                          <div className="font-mono text-sm mb-2">
                            <div><strong>Email:</strong> user@example.com</div>
                            <div><strong>Password:</strong> UserPass123!</div>
                            <div><strong>Expected:</strong> User Dashboard</div>
                          </div>
                          <LoginButton
                            onClick={() => simulateLogin('user')}
                            successDuration={3000}
                            className="w-full"
                          >
                            Test User Login
                          </LoginButton>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">Error Test</h4>
                      
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <div className="font-mono text-sm mb-2">
                            <div><strong>Email:</strong> invalid@test.com</div>
                            <div><strong>Password:</strong> wrongpass</div>
                            <div><strong>Expected:</strong> Invalid Credentials Error</div>
                          </div>
                          <LoginButton
                            onClick={() => simulateLogin('error')}
                            errorText="Login failed! Invalid credentials"
                            successDuration={3000}
                            className="w-full"
                            variant="destructive"
                          >
                            Test Error State
                          </LoginButton>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold mb-3">Async-Button Features Tested</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Loading state with spinner</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Success state with checkmark</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Auto-reset to idle state</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Error handling with alerts</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Button width stability</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Accessibility announcements</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Features & Validation Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Form Validation Features</CardTitle>
                  <CardDescription>
                    Comprehensive validation and error handling capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Email Validation</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Required field validation
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Email format validation
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Real-time error clearing
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Server error integration
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Password Validation</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          8+ character requirement
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Strength validation (2 of 4 rules)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Dynamic error feedback
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Accessibility compliant
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold mb-3">Enhanced Error Handling</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Granular Errors</AlertTitle>
                        <AlertDescription>
                          Field-specific error messages for better user experience
                        </AlertDescription>
                      </Alert>
                      
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Real-time Updates</AlertTitle>
                        <AlertDescription>
                          Errors clear automatically as users fix them
                        </AlertDescription>
                      </Alert>
                      
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Toast Notifications</AlertTitle>
                        <AlertDescription>
                          Non-intrusive error notifications using react-hot-toast
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Setup Instructions Tab */}
          <TabsContent value="instructions" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Setup Instructions</CardTitle>
                  <CardDescription>
                    Step-by-step guide to run the demo locally
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">1. Prerequisites</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Ensure you have the following installed:
                      </p>
                      <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                        <li>Node.js 18+</li>
                        <li>npm or yarn</li>
                        <li>Git</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">2. Installation</h4>
                      <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                        <div># Clone the repository</div>
                        <div>git clone `&lt;your-repo-url&gt;`</div>
                        <div>cd my-fullstack-app</div>
                        <div className="mt-2"># Install dependencies</div>
                        <div>npm install</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">3. Environment Setup</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Create a .env.local file with the following variables:
                      </p>
                      <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                        <div>NEXT_PUBLIC_SUPABASE_URL=your_supabase_url</div>
                        <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key</div>
                        <div>TRPC_SECRET=your_trpc_secret</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">4. Run Development Server</h4>
                      <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                        <div>npm run dev</div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        The application will be available at{' '}
                        <code className="bg-muted px-1 rounded">http://localhost:3000</code>
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">5. Access the Demo</h4>
                      <p className="text-sm text-muted-foreground">
                        Navigate to{' '}
                        <code className="bg-muted px-1 rounded">http://localhost:3000/demo-new-login</code>{' '}
                        to test the new login form.
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold mb-3">Available Scripts</h4>
                    <div className="grid gap-2">
                      <div className="flex justify-between items-center p-2 border rounded">
                        <code className="text-sm">npm run dev</code>
                        <span className="text-sm text-muted-foreground">Start development server</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <code className="text-sm">npm run build</code>
                        <span className="text-sm text-muted-foreground">Build for production</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <code className="text-sm">npm run start</code>
                        <span className="text-sm text-muted-foreground">Start production server</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <code className="text-sm">npm run lint</code>
                        <span className="text-sm text-muted-foreground">Run ESLint</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Dependencies</CardTitle>
                  <CardDescription>
                    Key packages and technologies used in this demo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Frontend</h4>
                      <ul className="text-sm space-y-1">
                        <li>• React Hook Form</li>
                        <li>• Zod Validation</li>
                        <li>• shadcn/ui Components</li>
                        <li>• Tailwind CSS</li>
                        <li>• Lucide Icons</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Backend</h4>
                      <ul className="text-sm space-y-1">
                        <li>• tRPC</li>
                        <li>• Supabase</li>
                        <li>• Next.js</li>
                        <li>• TypeScript</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}