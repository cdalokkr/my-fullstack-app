
import React from 'react';
import { 
  AdvancedAsyncButton, 
  AdvancedLoginButton, 
  AdvancedSaveButton, 
  AdvancedDeleteButton, 
  AdvancedSubmitButton,
  type AsyncState 
} from '@/components/ui/advanced-async-button';

// Basic functional test component
function TestComponent() {
  const handleClick = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  return (
    <div>
      <AdvancedAsyncButton
        onClick={handleClick}
        initialText="Test Button"
        loadingText="Loading..."
        successText="Success!"
        errorText="Error!"
      />
      <AdvancedLoginButton onClick={handleClick} />
      <AdvancedSaveButton onClick={handleClick} />
      <AdvancedDeleteButton onClick={handleClick} />
      <AdvancedSubmitButton onClick={handleClick} />
    </div>
  );
}

export default TestComponent;
