"use client"

import React, { useState } from 'react'
import { SimpleModal } from '@/components/ui/SimpleModal'
import { Button } from '@/components/ui/button'

export function SimpleModalScrollingTest() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">SimpleModal Scrolling Test</h1>
      <p className="mb-4">This test verifies:</p>
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>SimpleModal opens and closes properly</li>
        <li>Vertical scrolling works within the modal</li>
        <li>Height constraints keep modal within viewport</li>
        <li>Loading states and auto-close work</li>
        <li>Responsive design on different screen sizes</li>
      </ul>
      
      <Button onClick={() => setIsOpen(true)}>Open Test Modal</Button>

      <SimpleModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Test Modal with Long Content"
        description="This modal contains a lot of content to test scrolling functionality."
        onSubmit={async () => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 2000))
        }}
        submitText="Submit Test"
        submitLoadingText="Submitting..."
        submitSuccessText="Success!"
        autoCloseDuration={1500}
        size="lg"
        className="max-w-4xl"
      >
        {/* Add extensive content to test scrolling */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Section 1</h2>
            <p className="text-sm text-gray-600">This is the first section of content.</p>
          </div>
          
          {[...Array(20)].map((_, i) => (
            <div key={i} className="border p-4 rounded">
              <h3 className="font-semibold mb-2">Form Field Group {i + 1}</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium">Field {i + 1}.1</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded mt-1" 
                    placeholder={`Input ${i + 1}.1`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Field {i + 1}.2</label>
                  <input 
                    type="email" 
                    className="w-full p-2 border rounded mt-1" 
                    placeholder={`Input ${i + 1}.2`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Field {i + 1}.3</label>
                  <select className="w-full p-2 border rounded mt-1">
                    <option>Option A</option>
                    <option>Option B</option>
                    <option>Option C</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          
          <div className="text-center pt-4">
            <h2 className="text-xl font-semibold mb-2">Final Section</h2>
            <p className="text-sm text-gray-600">
              This is the final section to ensure the scrollbar reaches the end properly.
            </p>
          </div>
        </div>
      </SimpleModal>
    </div>
  )
}

// Export default for easy importing
export default SimpleModalScrollingTest