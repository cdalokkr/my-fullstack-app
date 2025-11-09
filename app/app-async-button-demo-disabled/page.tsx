"use client";

import { useState } from "react";
import AsyncButton, { LoginButton } from "@/components/ui/async-button";
import CreateUserDialog from "@/components/ui/create-user-dialog";
import { Upload, Server, CheckCircle, Trash2, AlertTriangle, Database, Loader2, Save, Send } from "lucide-react";

export default function AsyncButtonDemo() {
  const [uploadCount, setUploadCount] = useState(0);
  const [resetCount, setResetCount] = useState(0);

  const handleUpload = async () => {
    // Simulate upload process
    await new Promise((r) => setTimeout(r, 1000));
    setUploadCount(prev => prev + 1);
  };

  const handleReset = async () => {
    // Simulate reset process
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setResetCount(prev => prev + 1);
  };

  const handleSave = async () => {
    // Simulate save operation
    await new Promise((r) => setTimeout(r, 800));
  };

  const handleSubmit = async () => {
    // Simulate form submission
    await new Promise((r) => setTimeout(r, 1200));
  };

  const handleFailingOperation = async () => {
    // Simulate a failing operation
    await new Promise((resolve, reject) => setTimeout(() => reject(new Error("Operation failed")), 1000));
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AsyncButton Component Demo</h1>
        <p className="text-gray-600">
          This page demonstrates the AsyncButton component with various configurations including different states.
        </p>
      </div>

      <div className="space-y-12">
        {/* Basic Examples */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Basic Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upload Button with Steps */}
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-4">Upload File</h3>
              <AsyncButton
                onClick={handleUpload}
                loadingText="Uploading..."
                successText="Uploaded!"
                errorText="Failed"
                icons={{
                  idle: <Upload className="w-4 h-4" />,
                  loading: <Loader2 className="w-4 h-4 animate-spin" />,
                  success: <CheckCircle className="w-4 h-4" />,
                  error: <AlertTriangle className="w-4 h-4" />
                }}
              />
              <p className="text-sm text-gray-500 mt-2">Uploads completed: {uploadCount}</p>
            </div>

            {/* Save Button */}
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-4">Save Changes</h3>
              <AsyncButton
                onClick={handleSave}
                loadingText="Saving..."
                successText="Saved!"
                errorText="Failed"
                icons={{
                  idle: <Save className="w-4 h-4" />
                }}
                successDuration={2000}
              >
                Save
              </AsyncButton>
            </div>

            {/* Submit Button */}
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-4">Submit Form</h3>
              <AsyncButton
                onClick={handleSubmit}
                loadingText="Submitting..."
                successText="Submitted!"
                errorText="Submission Failed"
                icons={{
                  idle: <Send className="w-4 h-4" />
                }}
              >
                Submit
              </AsyncButton>
            </div>
          </div>
        </section>

        {/* LoginButton Example */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">LoginButton Component</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Successful Login */}
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-4">Successful Login</h3>
              <LoginButton
                onClick={() => new Promise(r => setTimeout(r, 1500))}
                successDuration={3000}
              >
                Sign In
              </LoginButton>
            </div>

            {/* Failed Login */}
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-4">Failed Login</h3>
              <LoginButton
                onClick={() => new Promise((_, reject) => setTimeout(() => reject(new Error("Invalid credentials")), 1500))}
                errorText="Invalid email or password"
                successDuration={3000}
                variant="destructive"
              >
                Sign In
              </LoginButton>
            </div>
          </div>
        </section>

        {/* Dangerous Actions */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Dangerous Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reset Database */}
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-4">Database Reset</h3>
              <AsyncButton
                onClick={handleReset}
                loadingText="Resetting..."
                successText="Database Reset"
                errorText="Failed"
                variant="danger"
                icons={{
                  idle: <Database className="w-4 h-4" />,
                  loading: <Loader2 className="w-4 h-4 animate-spin" />,
                  success: <CheckCircle className="w-4 h-4" />,
                  error: <AlertTriangle className="w-4 h-4" />
                }}
                successDuration={2000}
              >
                Reset Database
              </AsyncButton>
              <p className="text-sm text-gray-500 mt-2">Reset operations: {resetCount}</p>
            </div>

            {/* Delete All */}
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-4">Delete All Items</h3>
              <AsyncButton
                onClick={handleFailingOperation}
                loadingText="Deleting..."
                successText="All Deleted"
                errorText="Deletion Failed"
                variant="danger"
                icons={{
                  idle: <Trash2 className="w-4 h-4" />,
                  loading: <Loader2 className="w-4 h-4 animate-spin" />,
                  success: <CheckCircle className="w-4 h-4" />,
                  error: <AlertTriangle className="w-4 h-4" />
                }}
              >
                Delete All
              </AsyncButton>
            </div>
          </div>
        </section>

        {/* Create User Dialog */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Create User Dialog</h2>
          <div className="p-6 border rounded-lg">
            <CreateUserDialog />
            <p className="text-sm text-gray-500 mt-4">
              This dialog demonstrates form validation and async operations.
            </p>
          </div>
        </section>

        {/* Color Variants */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Color Variants</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <h4 className="font-medium mb-2">Primary</h4>
              <AsyncButton
                onClick={() => new Promise(r => setTimeout(r, 1000))}
                loadingText="Loading..."
                successText="Done!"
                variant="primary"
              >
                Primary
              </AsyncButton>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <h4 className="font-medium mb-2">Success</h4>
              <AsyncButton
                onClick={() => new Promise(r => setTimeout(r, 1000))}
                loadingText="Loading..."
                successText="Done!"
                variant="success"
              >
                Success
              </AsyncButton>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <h4 className="font-medium mb-2">Danger</h4>
              <AsyncButton
                onClick={() => new Promise(r => setTimeout(r, 1000))}
                loadingText="Loading..."
                successText="Done!"
                variant="danger"
              >
                Danger
              </AsyncButton>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <h4 className="font-medium mb-2">Secondary</h4>
              <AsyncButton
                onClick={() => new Promise(r => setTimeout(r, 1000))}
                loadingText="Loading..."
                successText="Done!"
                variant="secondary"
              >
                Secondary
              </AsyncButton>
            </div>
          </div>
        </section>

        {/* Usage Instructions */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Usage Instructions</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Import and Basic Usage</h3>
            <pre className="text-sm bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto">
{`import AsyncButton from "@/components/ui/async-button";

// Basic usage
<AsyncButton
  onClick={handleAsyncOperation}
  loadingText="Loading..."
  successText="Success!"
  errorText="Failed!"
>
  Click me
</AsyncButton>`}
            </pre>

            <h3 className="text-lg font-medium mb-4 mt-6">With Custom Icons</h3>
            <pre className="text-sm bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto">
{`// With custom icons for different states
<AsyncButton
  onClick={handleUpload}
  loadingText="Uploading..."
  successText="Uploaded!"
  errorText="Failed"
  icons={{
    idle: <Upload className="w-4 h-4" />,
    loading: <Loader2 className="w-4 h-4 animate-spin" />,
    success: <CheckCircle className="w-4 h-4" />,
    error: <AlertTriangle className="w-4 h-4" />
  }}
>
  Upload File
</AsyncButton>`}
            </pre>

            <h3 className="text-lg font-medium mb-4 mt-6">Using LoginButton</h3>
            <pre className="text-sm bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto">
{`// Specialized button for login forms
import { LoginButton } from "@/components/ui/async-button";

<LoginButton
  onClick={handleLogin}
  successDuration={3000}
  hasFormErrors={hasFormErrors}
>
  Sign In
</LoginButton>`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}