#!/usr/bin/env node

/**
 * Test Suite for Modular AI Agent
 * Runs all available tests in the numbered structure
 */

import fs from 'fs';
import path from 'path';

async function runTestSuite() {
    console.log('🧪 Modular AI Agent - Test Suite');
    console.log('=' .repeat(50));
    
    const testDir = path.dirname(new URL(import.meta.url).pathname);
    const testFiles = fs.readdirSync(testDir)
        .filter(file => file.startsWith('test-') && file.endsWith('.js'))
        .filter(file => file !== 'test-suite.js'); // Don't include self
    
    console.log(`📋 Found ${testFiles.length} test files\n`);
    
    let passedTests = 0;
    let totalTests = testFiles.length;
    
    for (const testFile of testFiles) {
        try {
            console.log(`▶️ Running ${testFile}...`);
            
            // Dynamic import of test file
            const testPath = path.join(testDir, testFile);
            const testModule = await import(`file:///${testPath.replace(/\\/g, '/')}`);
            
            // Check if test exports a run function
            if (testModule.run && typeof testModule.run === 'function') {
                const result = await testModule.run();
                if (result === true) {
                    console.log(`✅ ${testFile} - PASSED\n`);
                    passedTests++;
                } else {
                    console.log(`❌ ${testFile} - FAILED\n`);
                }
            } else {
                console.log(`⚠️ ${testFile} - No run() function exported\n`);
            }
            
        } catch (error) {
            console.log(`❌ ${testFile} - ERROR: ${error.message}\n`);
        }
    }
    
    console.log('=' .repeat(50));
    console.log(`📊 Test Results: ${passedTests}/${totalTests} passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed!');
        return true;
    } else {
        console.log('❌ Some tests failed');
        return false;
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTestSuite();
}

export { runTestSuite };
