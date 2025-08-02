#!/usr/bin/env node

/**
 * Test script for DocumentScannerPro search functionality
 */

const BASE_URL = 'http://localhost:5000';

async function testSearchAPI() {
  console.log('🔍 Testing DocumentScannerPro Search API...\n');

  try {
    // Test 1: Basic text search
    console.log('1. Testing basic text search...');
    const textSearchResponse = await fetch(`${BASE_URL}/api/documents/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'invoice' })
    });
    
    if (textSearchResponse.ok) {
      const results = await textSearchResponse.json();
      console.log(`✅ Text search: Found ${results.length} documents`);
      if (results.length > 0) {
        console.log(`   - First result: "${results[0].title}"`);
      }
    } else {
      console.log(`❌ Text search failed: ${textSearchResponse.status}`);
    }

    // Test 2: Document type filter
    console.log('\n2. Testing document type filter...');
    const typeSearchResponse = await fetch(`${BASE_URL}/api/documents/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentType: 'invoice' })
    });
    
    if (typeSearchResponse.ok) {
      const results = await typeSearchResponse.json();
      console.log(`✅ Type filter: Found ${results.length} invoice documents`);
    } else {
      console.log(`❌ Type filter failed: ${typeSearchResponse.status}`);
    }

    // Test 3: Entity filter (emails)
    console.log('\n3. Testing entity filter (emails)...');
    const emailSearchResponse = await fetch(`${BASE_URL}/api/documents/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hasEmails: true })
    });
    
    if (emailSearchResponse.ok) {
      const results = await emailSearchResponse.json();
      console.log(`✅ Email filter: Found ${results.length} documents with emails`);
    } else {
      console.log(`❌ Email filter failed: ${emailSearchResponse.status}`);
    }

    // Test 4: Combined search
    console.log('\n4. Testing combined search...');
    const combinedSearchResponse = await fetch(`${BASE_URL}/api/documents/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: 'amount',
        hasAmounts: true,
        minConfidence: 0.5
      })
    });
    
    if (combinedSearchResponse.ok) {
      const results = await combinedSearchResponse.json();
      console.log(`✅ Combined search: Found ${results.length} documents`);
      if (results.length > 0) {
        console.log(`   - Results have amounts and >50% confidence`);
      }
    } else {
      console.log(`❌ Combined search failed: ${combinedSearchResponse.status}`);
    }

    // Test 5: GET endpoint compatibility
    console.log('\n5. Testing GET endpoint...');
    const getSearchResponse = await fetch(`${BASE_URL}/api/documents/search?query=test&hasEmails=true`);
    
    if (getSearchResponse.ok) {
      const results = await getSearchResponse.json();
      console.log(`✅ GET search: Found ${results.length} documents`);
    } else {
      console.log(`❌ GET search failed: ${getSearchResponse.status}`);
    }

    console.log('\n🎉 Search API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running on http://localhost:5000');
  }
}

// Run the test
testSearchAPI();
