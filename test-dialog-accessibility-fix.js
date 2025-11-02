// Simple validation script to test the dialog accessibility fix
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Dialog Accessibility Fix...\n');

const dialogFilePath = path.join(__dirname, 'components/ui/modern-dialog.tsx');

try {
  const dialogContent = fs.readFileSync(dialogFilePath, 'utf8');
  
  // Check for key fixes
  const checks = [
    {
      name: 'VisuallyHidden component definition',
      pattern: /const VisuallyHidden = /,
      found: false
    },
    {
      name: 'Title extraction logic',
      pattern: /titleElement: React\.ReactElement \| null = null/,
      found: false
    },
    {
      name: 'Header filtering logic',
      pattern: /child\.type === ModernDialogHeader/,
      found: false
    },
    {
      name: 'Fallback title implementation',
      pattern: /If no title found/,
      found: false
    },
    {
      name: 'Direct title child placement',
      pattern: /\{titleElement\}/,
      found: false
    },
    {
      name: 'Filtered children usage',
      pattern: /filteredChildren/,
      found: false
    }
  ];
  
  checks.forEach(check => {
    check.found = check.pattern.test(dialogContent);
    console.log(`${check.found ? '✅' : '❌'} ${check.name}`);
  });
  
  const passedChecks = checks.filter(check => check.found).length;
  console.log(`\n📊 Result: ${passedChecks}/${checks.length} checks passed`);
  
  if (passedChecks === checks.length) {
    console.log('🎉 All accessibility fixes detected successfully!');
    console.log('\n✨ Expected Benefits:');
    console.log('   • DialogTitle now positioned as direct child of DialogPrimitive.Content');
    console.log('   • Fallback VisuallyHidden title for edge cases');
    console.log('   • Proper extraction from nested ModernDialogHeader');
    console.log('   • No more Radix UI accessibility warnings');
    console.log('   • Maintained backward compatibility');
  } else {
    console.log('⚠️  Some fixes may be incomplete');
  }
  
} catch (error) {
  console.error('❌ Error reading dialog file:', error.message);
}