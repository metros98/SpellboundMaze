// Unit tests for tricky letter logic
// Run with: node trickyLetters.test.js

// Confusion map for tricky letters
const TRICKY_LETTER_MAP = {
  'S': 'C',
  'C': 'K',
  'G': 'J',
  'A': 'E',
  'E': 'A'
};

function getTrickyLetters(word) {
  const wordLetters = word.split('').map(c => c.toUpperCase());
  const wordSet = new Set(wordLetters);
  const trickyLetters = [];

  for (const letter of wordLetters) {
    const tricky = TRICKY_LETTER_MAP[letter];
    if (tricky && !wordSet.has(tricky)) {
      trickyLetters.push(tricky.toLowerCase());
    }
  }

  return trickyLetters;
}

function shuffle(a) {
  for(let i=a.length-1;i>0;i--){ 
    const j=Math.floor(Math.random()*(i+1)); 
    [a[i],a[j]]=[a[j],a[i]];
  } 
  return a;
}

function getRandomLetters(count, excludeWord) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const result = [];
  
  for(let i = 0; i < count; i++) {
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    result.push(randomLetter);
  }
  
  return result;
}

function generateExtraLetters(word, extraCount, trickyLettersEnabled) {
  let extraLetters = [];
  
  if(extraCount > 0) {
    if(trickyLettersEnabled) {
      // Get tricky letter candidates
      const trickyCandidates = getTrickyLetters(word);
      
      // Shuffle and take up to extraCount
      const shuffledTricky = shuffle([...trickyCandidates]);
      const trickyToUse = shuffledTricky.slice(0, extraCount);
      extraLetters.push(...trickyToUse);
      
      // Fill remaining slots with random letters
      const remaining = extraCount - extraLetters.length;
      if(remaining > 0) {
        const randomLetters = getRandomLetters(remaining, word);
        extraLetters.push(...randomLetters);
      }
    } else {
      // Use fully random letters (existing behavior)
      extraLetters = getRandomLetters(extraCount, word);
    }
  }
  
  return extraLetters;
}

// Test cases
function runTests() {
  console.log('Running Tricky Letters Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: getTrickyLetters with "SPACE" (Medium mode)
  console.log('Test 1: Word "SPACE" - should skip C and E (already in word)');
  const trickySpace = getTrickyLetters('SPACE');
  const expectedSpace = ['k']; // S->C skipped (C in word), A->E skipped (E in word), C->K, E->A skipped (A in word)
  if (JSON.stringify(trickySpace.sort()) === JSON.stringify(expectedSpace.sort())) {
    console.log('✓ PASSED: Got', trickySpace);
    passed++;
  } else {
    console.log('✗ FAILED: Expected', expectedSpace, 'but got', trickySpace);
    failed++;
  }
  
  // Test 2: getTrickyLetters with "GLASS"
  console.log('\nTest 2: Word "GLASS" - should generate J, E, C, C');
  const trickyGlass = getTrickyLetters('GLASS');
  const expectedGlass = ['j', 'e', 'c', 'c']; // G->J, A->E, S->C (twice)
  if (JSON.stringify(trickyGlass.sort()) === JSON.stringify(expectedGlass.sort())) {
    console.log('✓ PASSED: Got', trickyGlass);
    passed++;
  } else {
    console.log('✗ FAILED: Expected', expectedGlass, 'but got', trickyGlass);
    failed++;
  }
  
  // Test 3: getTrickyLetters with "BIG"
  console.log('\nTest 3: Word "BIG" - should generate J');
  const trickyBig = getTrickyLetters('BIG');
  const expectedBig = ['j']; // G->J
  if (JSON.stringify(trickyBig.sort()) === JSON.stringify(expectedBig.sort())) {
    console.log('✓ PASSED: Got', trickyBig);
    passed++;
  } else {
    console.log('✗ FAILED: Expected', expectedBig, 'but got', trickyBig);
    failed++;
  }
  
  // Test 4: getTrickyLetters with "ACE"
  console.log('\nTest 4: Word "ACE" - should generate K only');
  const trickyAce = getTrickyLetters('ACE');
  const expectedAce = ['k']; // A->E skipped (E in word), C->K, E->A skipped (A in word)
  if (JSON.stringify(trickyAce.sort()) === JSON.stringify(expectedAce.sort())) {
    console.log('✓ PASSED: Got', trickyAce);
    passed++;
  } else {
    console.log('✗ FAILED: Expected', expectedAce, 'but got', trickyAce);
    failed++;
  }
  
  // Test 5: getTrickyLetters with "CAT" - C->K, A->E
  console.log('\nTest 5: Word "CAT" - should generate K and E');
  const trickyCat = getTrickyLetters('CAT');
  const expectedCat = ['k', 'e']; // C->K, A->E
  if (JSON.stringify(trickyCat.sort()) === JSON.stringify(expectedCat.sort())) {
    console.log('✓ PASSED: Got', trickyCat);
    passed++;
  } else {
    console.log('✗ FAILED: Expected', expectedCat, 'but got', trickyCat);
    failed++;
  }
  
  // Test 6: generateExtraLetters when disabled - should use random letters
  console.log('\nTest 6: Extra letters with trickyLettersEnabled=false');
  const randomExtras = generateExtraLetters('SPACE', 2, false);
  if (randomExtras.length === 2) {
    console.log('✓ PASSED: Generated', randomExtras.length, 'random letters:', randomExtras);
    passed++;
  } else {
    console.log('✗ FAILED: Expected 2 letters but got', randomExtras.length);
    failed++;
  }
  
  // Test 7: generateExtraLetters with SPACE (Medium: 2 extra)
  console.log('\nTest 7: Word "SPACE" with Medium difficulty (2 extra letters)');
  const extrasSpace = generateExtraLetters('SPACE', 2, true);
  const wordSpace = 'SPACE'.toUpperCase();
  const validTricky = ['k'];
  const hasValidTricky = extrasSpace.some(letter => validTricky.includes(letter.toLowerCase()));
  if (extrasSpace.length === 2 && hasValidTricky) {
    console.log('✓ PASSED: Generated 2 letters including tricky:', extrasSpace);
    passed++;
  } else {
    console.log('✗ FAILED: Expected 2 letters with at least one tricky, got', extrasSpace);
    failed++;
  }
  
  // Test 8: generateExtraLetters with GLASS (Hard: 5 extra)
  console.log('\nTest 8: Word "GLASS" with Hard difficulty (5 extra letters)');
  const extrasGlass = generateExtraLetters('GLASS', 5, true);
  const trickyGlassCandidates = getTrickyLetters('GLASS');
  if (extrasGlass.length === 5) {
    const trickyCount = extrasGlass.filter(letter => 
      trickyGlassCandidates.includes(letter.toLowerCase())
    ).length;
    console.log('✓ PASSED: Generated 5 letters:', extrasGlass, `(${trickyCount} tricky, ${5-trickyCount} random)`);
    passed++;
  } else {
    console.log('✗ FAILED: Expected 5 letters but got', extrasGlass.length);
    failed++;
  }
  
  // Test 9: Word with no tricky letter matches - "BED" (B has no mapping, E->A skipped if D exists, etc)
  console.log('\nTest 9: Word "BED" - E->A generated since A not in word');
  const trickyBed = getTrickyLetters('BED');
  const expectedBed = ['a']; // E->A
  if (JSON.stringify(trickyBed.sort()) === JSON.stringify(expectedBed.sort())) {
    console.log('✓ PASSED: Got', trickyBed);
    passed++;
  } else {
    console.log('✗ FAILED: Expected', expectedBed, 'but got', trickyBed);
    failed++;
  }
  
  // Test 10: Case insensitivity
  console.log('\nTest 10: Case insensitivity - "space" vs "SPACE"');
  const trickyLower = getTrickyLetters('space');
  const trickyUpper = getTrickyLetters('SPACE');
  if (JSON.stringify(trickyLower.sort()) === JSON.stringify(trickyUpper.sort())) {
    console.log('✓ PASSED: Both produce same result:', trickyLower);
    passed++;
  } else {
    console.log('✗ FAILED: Case sensitivity issue');
    failed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`Tests completed: ${passed + failed}`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log('='.repeat(50));
  
  return failed === 0;
}

// Run the tests
const success = runTests();
process.exit(success ? 0 : 1);
