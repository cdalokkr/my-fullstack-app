"use client"

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { 
  ActionButton, 
  EditButton, 
  SaveButton, 
  CancelButton, 
  DeleteButton, 
  AddButton, 
  ViewButton, 
  SettingsButton 
} from '@/components/ui/action-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UserOperationModalOverlay } from '@/components/dashboard/user-operation-modal-overlay'
import { DualLayerLoadingCoordinator } from '@/components/dashboard/dual-layer-loading-coordinator'
import { LoadingPriority } from '@/components/ui/loading-states'
import toast from 'react-hot-toast'

/**
 * ActionButton Demo Page
 * 
 * This page demonstrates the comprehensive ActionButton component
 * with all variants, animations, and real-world usage examples.
 */
export default function ActionButtonDemoPage() {
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({})
  
  const handleAction = async (action: string) => {
    setLoadingStates(prev => ({ ...prev, [action]: true }))
    
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setLoadingStates(prev => ({ ...prev, [action]: false }))
    toast.success(`${action} action completed!`)
  }

  const handleSuccess = (action: string) => {
    toast.success(`${action} action successful!`)
  }

  const handleError = (action: string) => {
    toast.error(`${action} action failed!`)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Modal overlay for operations */}
      <UserOperationModalOverlay />
      
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold tracking-tight">ActionButton Component Demo</h1>
          <p className="text-xl text-muted-foreground">
            Comprehensive showcase of the reusable ActionButton component
          </p>
        </motion.div>

        {/* Demo Sections */}
        <DualLayerLoadingCoordinator
          enableAutoStart={false}
          enableMetrics={true}
          className="space-y-8"
        >
          {/* Basic Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Action Buttons</CardTitle>
              <CardDescription>
                All action types with default styling and animations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <EditButton 
                  onClick={() => handleAction('edit')}
                  loading={loadingStates.edit}
                  aria-label="Edit user profile"
                  className="w-full"
                >
                  Edit
                </EditButton>
                
                <SaveButton 
                  onClick={() => handleAction('save')}
                  loading={loadingStates.save}
                  aria-label="Save changes"
                  className="w-full"
                >
                  Save
                </SaveButton>
                
                <CancelButton 
                  onClick={() => handleAction('cancel')}
                  loading={loadingStates.cancel}
                  aria-label="Cancel operation"
                  className="w-full"
                >
                  Cancel
                </CancelButton>
                
                <DeleteButton 
                  onClick={() => handleAction('delete')}
                  loading={loadingStates.delete}
                  aria-label="Delete item"
                  className="w-full"
                >
                  Delete
                </DeleteButton>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <AddButton 
                  onClick={() => handleAction('add')}
                  loading={loadingStates.add}
                  aria-label="Add new item"
                  className="w-full"
                >
                  Add New
                </AddButton>
                
                <ViewButton 
                  onClick={() => handleAction('view')}
                  loading={loadingStates.view}
                  aria-label="View details"
                  className="w-full"
                >
                  View
                </ViewButton>
                
                <SettingsButton 
                  onClick={() => handleAction('settings')}
                  loading={loadingStates.settings}
                  aria-label="Open settings"
                  className="w-full"
                >
                  Settings
                </SettingsButton>
              </div>
            </CardContent>
          </Card>

          {/* Icon-Only Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Icon-Only Variants</CardTitle>
              <CardDescription>
                Perfect for dense interfaces and toolbar actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 justify-center">
                <EditButton 
                  variant="icon-only"
                  onClick={() => handleSuccess('Edit')}
                  aria-label="Edit user"
                />
                
                <SaveButton 
                  variant="icon-only"
                  onClick={() => handleSuccess('Save')}
                  aria-label="Save changes"
                />
                
                <CancelButton 
                  variant="icon-only"
                  onClick={() => handleSuccess('Cancel')}
                  aria-label="Cancel operation"
                />
                
                <DeleteButton 
                  variant="icon-only"
                  onClick={() => handleSuccess('Delete')}
                  aria-label="Delete item"
                />
                
                <AddButton 
                  variant="icon-only"
                  onClick={() => handleSuccess('Add')}
                  aria-label="Add new item"
                />
                
                <ViewButton 
                  variant="icon-only"
                  onClick={() => handleSuccess('View')}
                  aria-label="View details"
                />
                
                <SettingsButton 
                  variant="icon-only"
                  onClick={() => handleSuccess('Settings')}
                  aria-label="Open settings"
                />
              </div>
            </CardContent>
          </Card>

          {/* Size Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Size Variants</CardTitle>
              <CardDescription>
                Small, medium, and large button sizes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="w-16 text-sm font-medium">Small:</span>
                  <EditButton size="sm">Edit</EditButton>
                  <EditButton variant="icon-only" size="sm" />
                  <SaveButton size="sm">Save</SaveButton>
                  <DeleteButton size="sm">Delete</DeleteButton>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="w-16 text-sm font-medium">Medium:</span>
                  <EditButton size="md">Edit</EditButton>
                  <EditButton variant="icon-only" size="md" />
                  <SaveButton size="md">Save</SaveButton>
                  <DeleteButton size="md">Delete</DeleteButton>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="w-16 text-sm font-medium">Large:</span>
                  <EditButton size="lg">Edit</EditButton>
                  <EditButton variant="icon-only" size="lg" />
                  <SaveButton size="lg">Save</SaveButton>
                  <DeleteButton size="lg">Delete</DeleteButton>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* State Variations */}
          <Card>
            <CardHeader>
              <CardTitle>State Variations</CardTitle>
              <CardDescription>
                Disabled, loading, and error states
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <EditButton disabled>Disabled Edit</EditButton>
                <SaveButton loading>Loading Save</SaveButton>
                <DeleteButton disabled variant="icon-only" />
                <AddButton loading variant="icon-only" />
              </div>
            </CardContent>
          </Card>

          {/* Real-world Usage Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Real-world Usage Examples</CardTitle>
              <CardDescription>
                Common use cases and patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Table Row Example */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="text-lg font-semibold mb-4">User Management Table</h3>
                <div className="space-y-3">
                  {[
                    { email: 'john.doe@example.com', name: 'John Doe', role: 'Admin' },
                    { email: 'jane.smith@example.com', name: 'Jane Smith', role: 'User' },
                    { email: 'bob.wilson@example.com', name: 'Bob Wilson', role: 'User' }
                  ].map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded bg-background">
                      <div className="flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email} • {user.role}</div>
                      </div>
                      <div className="flex gap-2">
                        <EditButton 
                          size="sm" 
                          onClick={() => handleSuccess(`Edit ${user.name}`)}
                          aria-label={`Edit ${user.name}`}
                        >
                          Edit
                        </EditButton>
                        <DeleteButton 
                          size="sm" 
                          onClick={() => handleSuccess(`Delete ${user.name}`)}
                          aria-label={`Delete ${user.name}`}
                        >
                          Delete
                        </DeleteButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions Example */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="text-lg font-semibold mb-4">Form Actions</h3>
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="p-3 border rounded bg-background">
                      <label className="text-sm font-medium">User Information</label>
                      <div className="mt-2 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 justify-end pt-4 border-t">
                    <CancelButton 
                      onClick={() => handleSuccess('Form cancelled')}
                      disabled={Object.values(loadingStates).some(Boolean)}
                    >
                      Cancel
                    </CancelButton>
                    <SaveButton
                      onClick={() => handleAction('form-save')}
                      loading={loadingStates['form-save']}
                      disabled={Object.values(loadingStates).some(Boolean)}
                      className="min-w-[120px]"
                    >
                      {loadingStates['form-save'] ? 'Saving...' : 'Save Changes'}
                    </SaveButton>
                  </div>
                </div>
              </div>

              {/* Dashboard Actions Example */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="text-lg font-semibold mb-4">Dashboard Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <AddButton 
                    className="w-full"
                    onClick={() => handleSuccess('Add user')}
                    aria-label="Add new user"
                  >
                    Add User
                  </AddButton>
                  <ViewButton 
                    className="w-full"
                    onClick={() => handleSuccess('View reports')}
                    aria-label="View reports"
                  >
                    View Reports
                  </ViewButton>
                  <SettingsButton 
                    className="w-full"
                    onClick={() => handleSuccess('Open settings')}
                    aria-label="Open settings"
                  >
                    Settings
                  </SettingsButton>
                  <EditButton 
                    className="w-full"
                    onClick={() => handleSuccess('Edit profile')}
                    aria-label="Edit profile"
                  >
                    Edit Profile
                  </EditButton>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Animation Showcase */}
          <Card>
            <CardHeader>
              <CardTitle>Animation Showcase</CardTitle>
              <CardDescription>
                Smooth micro-interactions and hover effects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <motion.div 
                  className="text-center p-4 border rounded-lg"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <EditButton className="w-full mb-2" />
                  <p className="text-sm text-muted-foreground">Hover Scale: 1.05x</p>
                </motion.div>
                
                <motion.div 
                  className="text-center p-4 border rounded-lg"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <SaveButton className="w-full mb-2" />
                  <p className="text-sm text-muted-foreground">Shadow Elevation</p>
                </motion.div>
                
                <motion.div 
                  className="text-center p-4 border rounded-lg"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <DeleteButton className="w-full mb-2" />
                  <p className="text-sm text-muted-foreground">Color Transitions</p>
                </motion.div>
                
                <motion.div 
                  className="text-center p-4 border rounded-lg"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <AddButton className="w-full mb-2" />
                  <p className="text-sm text-muted-foreground">Icon Animations</p>
                </motion.div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Icons */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Icons</CardTitle>
              <CardDescription>
                Support for custom icon components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ActionButton
                  action="edit"
                  size="lg"
                  className="w-full"
                  onClick={() => handleSuccess('Custom edit action')}
                  aria-label="Custom edit action"
                >
                  Custom Edit
                </ActionButton>
                
                <ActionButton
                  action="settings"
                  variant="icon-only"
                  size="lg"
                  onClick={() => handleSuccess('Custom settings action')}
                  aria-label="Custom settings action"
                />
                
                <ActionButton
                  action="add"
                  size="lg"
                  className="w-full"
                  onClick={() => handleSuccess('Custom add action')}
                  aria-label="Custom add action"
                >
                  Custom Add
                </ActionButton>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance & Accessibility</CardTitle>
              <CardDescription>
                Built-in performance optimizations and accessibility features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Performance Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Hardware-accelerated animations (Framer Motion)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Tree-shakeable imports
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Optimized bundle size
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      60fps smooth animations
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Accessibility Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Automatic ARIA labels
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Keyboard navigation support
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Screen reader compatibility
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      High contrast support
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </DualLayerLoadingCoordinator>
      </div>
    </div>
  )
}