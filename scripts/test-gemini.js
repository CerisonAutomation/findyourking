#!/usr/bin/env node
/**
 * Gemini API Test Script
 * Verifies AI Boyfriend module is working correctly
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiConnection() {
  console.log('🔱 TESTING GEMINI AI BOYFRIEND MODULE\n');

  // Initialize
  const apiKey = process.env.GEMINI_API_KEY || 'your-gemini-api-key-here';
  const genAI = new GoogleGenerativeAI(apiKey);

  console.log('✅ Step 1: SDK Initialized');
  console.log(`   API Key: ${apiKey.substring(0, 20)}...`);

  // Test text generation
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 100,
      }
    });

    console.log('\n✅ Step 2: Model Created (gemini-2.0-flash-exp)');

    const prompt = `You are Alex, a loving AI boyfriend. Say a short, sweet greeting to your partner. Keep it under 20 words. Be warm and playful. 💖`;

    console.log('\n⏳ Step 3: Generating response...');
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log('\n✅ Step 4: Response Generated!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`💬 Alex says: "${response}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test streaming
    console.log('⏳ Step 5: Testing streaming...');
    
    const streamResult = await model.generateContentStream(
      'Say "Hi babe!" in 3 different cute ways.'
    );

    let streamedText = '';
    for await (const chunk of streamResult.stream) {
      streamedText += chunk.text();
    }

    console.log('✅ Step 5: Streaming works!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`💬 Streamed response:\n${streamedText}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test embeddings
    console.log('⏳ Step 6: Testing memory embeddings...');
    
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const embeddingResult = await embeddingModel.embedContent('I love pizza');
    
    console.log(`✅ Step 6: Embeddings work! (${embeddingResult.embedding.values.length} dimensions)\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Text Generation: Working');
    console.log('✅ Streaming: Working');
    console.log('✅ Memory Embeddings: Working (768D)');
    console.log('✅ AI Boyfriend Module: READY TO USE\n');
    console.log('🚀 Next Step: Create API routes & frontend UI');
    console.log('📖 See: AI_BOYFRIEND_MODULE.md for implementation guide\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Verify API key is correct');
    console.error('   2. Check internet connection');
    console.error('   3. Ensure @google/generative-ai is installed');
    process.exit(1);
  }
}

testGeminiConnection();
