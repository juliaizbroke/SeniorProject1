import { Question } from '../../types';
import { getContentHashForShuffling, getShuffleInfo } from './shuffleUtils';

export const createShuffleHandler = (
  questions: Question[],
  allQuestionsPool: Question[],
  lockedQuestions: Set<string>,
  lockedCategories: Set<string>,
  editingQuestions: Set<string>,
  getQuestionId: (question: Question, index: number) => string,
  onQuestionsChange: (questions: Question[]) => void,
  setLockedCategories: (categories: Set<string>) => void
) => {
  return (shuffleInfo: ReturnType<typeof getShuffleInfo>) => {
    const unlockedQuestionsWithIndex: { question: Question; index: number }[] = [];
    const lockedQuestionsWithIndex: { question: Question; index: number }[] = [];
    const lockedFakeAnswersWithIndex: { question: Question; index: number }[] = [];
    const unlockedFakeAnswersWithIndex: { question: Question; index: number }[] = [];

    // Helper function to get all real question answers
    const getAllRealAnswers = (shuffledQuestions: Question[]) => {
      const realAnswers = new Set<string>();
      
      lockedQuestionsWithIndex.forEach(item => {
        if (item.question.type !== 'fake answer' && item.question.answer?.trim()) {
          realAnswers.add(item.question.answer.trim().toLowerCase());
        }
      });
      
      unlockedQuestionsWithIndex.forEach(item => {
        const currentQuestion = shuffledQuestions[item.index];
        if (currentQuestion.answer?.trim()) {
          realAnswers.add(currentQuestion.answer.trim().toLowerCase());
        }
      });
      
      return realAnswers;
    };

    // Separate questions by lock state and type, preserving category lock info
    questions.forEach((question, index) => {
      const questionId = getQuestionId(question, index);
      
      // Debug: Verify lock state is being respected
      const isQuestionLocked = lockedQuestions.has(questionId);
      const isCategoryLocked = lockedCategories.has(questionId);
      
      console.log(`Question ${index}: ${question.type} - Blue Lock: ${isQuestionLocked}, Category Lock: ${isCategoryLocked}`);
      
      if (isQuestionLocked) {
        if (question.type === 'fake answer') {
          lockedFakeAnswersWithIndex.push({ question, index });
        } else {
          lockedQuestionsWithIndex.push({ question, index });
        }
      } else if (question.type === 'fake answer') {
        unlockedFakeAnswersWithIndex.push({ question, index });
      } else {
        unlockedQuestionsWithIndex.push({ question, index });
      }
    });

    // Handle different shuffle modes
    if (shuffleInfo.shuffleMode === 'disabled') {
      return; // Do nothing if shuffle is disabled
    }
    
    // Get locked fake answer texts to prevent duplication in real Q&A
    const lockedFakeAnswerTexts = new Set<string>();
    lockedFakeAnswersWithIndex.forEach(lockedFakeItem => {
      if (lockedFakeItem.question.answer?.trim()) {
        lockedFakeAnswerTexts.add(lockedFakeItem.question.answer.trim().toLowerCase());
      }
    });
    
    // Debug: Show locked question counts
    console.log(`Shuffle Debug: ${lockedQuestionsWithIndex.length} locked real questions, ${lockedFakeAnswersWithIndex.length} locked fake answers`);
    console.log(`Shuffle Debug: ${unlockedQuestionsWithIndex.length} unlocked real questions, ${unlockedFakeAnswersWithIndex.length} unlocked fake answers`);
    console.log('Locked fake answer texts to exclude:', Array.from(lockedFakeAnswerTexts));
      
    // Debug: Show locked fake answer details
    if (lockedFakeAnswersWithIndex.length > 0) {
      console.log('Locked fake answers:', lockedFakeAnswersWithIndex.map(item => ({
        index: item.index,
        answer: item.question.answer?.substring(0, 50) || 'no answer',
        category: item.question.category
      })));
    }

    // Handle different shuffle modes
    const shuffledQuestions = [...questions];
    
    if (shuffleInfo.shuffleMode === 'replace' && unlockedQuestionsWithIndex.length === 1) {
      // Replace single unlocked question with random question from same category
      const unlockedItem = unlockedQuestionsWithIndex[0];
      const targetCategory = unlockedItem.question.category;

      // Create sets to avoid duplication
      const lockedRealQuestionHashes = new Set(lockedQuestionsWithIndex.filter(item => item.question.type !== 'fake answer').map(item => getContentHashForShuffling(item.question)));
      const originalUnlockedHashes = new Set([getContentHashForShuffling(unlockedItem.question)]);
      const lockedFakeAnswerHashes = new Set(lockedFakeAnswersWithIndex.map(item => getContentHashForShuffling(item.question)));
      
      // Find available questions from the same category
      const availableFromSameCategory = allQuestionsPool.filter(q => {
        const contentHash = getContentHashForShuffling(q);
        const answerText = q.answer?.trim().toLowerCase() || '';
        return q.category === targetCategory && 
               !lockedRealQuestionHashes.has(contentHash) && 
               !originalUnlockedHashes.has(contentHash) &&
               !lockedFakeAnswerHashes.has(contentHash) &&
               !lockedFakeAnswerTexts.has(answerText) && // Prevent duplication with locked fake answers
               q.type !== 'fake answer'; // Exclude fake answers from real question pool
      });
      
      if (availableFromSameCategory.length > 0) {
        const randomReplacement = availableFromSameCategory[Math.floor(Math.random() * availableFromSameCategory.length)];
        shuffledQuestions[unlockedItem.index] = randomReplacement;
        
        // Now handle fake answer shuffling for replace mode
        // Use the helper function to get all real answers
        const allRealAnswers = getAllRealAnswers(shuffledQuestions);
        
        // Keep track of fake answers selected to avoid duplicates among fake answers
        const selectedFakeAnswers = new Set<string>();
        
        // PRIORITY 1: Locked fake answers are never changed - add their answers to prevent duplication
        lockedFakeAnswersWithIndex.forEach(lockedFakeItem => {
          if (lockedFakeItem.question.answer?.trim()) {
            selectedFakeAnswers.add(lockedFakeItem.question.answer.trim().toLowerCase());
          }
        });
        
        // PRIORITY 2: Process unlocked fake answers (includes category-locked ones)
        unlockedFakeAnswersWithIndex.forEach(fakeAnswerItem => {
          const fakeQuestionId = getQuestionId(fakeAnswerItem.question, fakeAnswerItem.index);
          
          // Skip fake answers that are currently being edited - they should not be affected by shuffling
          if (editingQuestions.has(fakeQuestionId)) {
            return; // Skip this fake answer, keep it unchanged
          }
          
          // Skip fake answers that are manual and haven't been saved yet
          if (fakeAnswerItem.question.category === 'fake answers - manual' && 
              (!fakeAnswerItem.question.answer || fakeAnswerItem.question.answer.trim() === '')) {
            return; // Skip manual fake answers that haven't been filled in
          }
          
          const isCategoryLocked = lockedCategories.has(fakeQuestionId);
          
          if (isCategoryLocked) {
            // If category is locked, only shuffle the answer within the same category
            const lockedCategory = fakeAnswerItem.question.category?.replace('fake answers - ', '') || '';
            const availableForFakeAnswer = allQuestionsPool.filter(q => {
              const contentHash = getContentHashForShuffling(q);
              return q.category === lockedCategory &&
                     !lockedRealQuestionHashes.has(contentHash) && // Don't use locked real questions as sources
                     !lockedFakeAnswerHashes.has(contentHash) && // Don't use locked fake answers as sources
                     !allRealAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate real answers
                     !selectedFakeAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate fake answers
                     q.type !== 'fake answer'; // Don't use existing fake answers
            });
            
            if (availableForFakeAnswer.length > 0) {
              const randomFakeReplacement = availableForFakeAnswer[Math.floor(Math.random() * availableForFakeAnswer.length)];
              const newFakeAnswer = { ...randomFakeReplacement };
              
              newFakeAnswer.type = 'fake answer';
              newFakeAnswer.category = `fake answers - ${randomFakeReplacement.category}`;
              newFakeAnswer.q_type = 'fake';
              
              shuffledQuestions[fakeAnswerItem.index] = newFakeAnswer;
              if (randomFakeReplacement.answer?.trim()) {
                selectedFakeAnswers.add(randomFakeReplacement.answer.trim().toLowerCase());
              }
            }
          } else {
            // Category not locked, can change both category and answer
            const availableForFakeAnswer = allQuestionsPool.filter(q => {
              const contentHash = getContentHashForShuffling(q);
              return !lockedRealQuestionHashes.has(contentHash) && // Don't use locked real questions as sources
                     !lockedFakeAnswerHashes.has(contentHash) && // Don't use locked fake answers as sources
                     !allRealAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate real answers
                     !selectedFakeAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate fake answers
                     q.type !== 'fake answer'; // Don't use existing fake answers
            });
            
            if (availableForFakeAnswer.length > 0) {
              const randomFakeReplacement = availableForFakeAnswer[Math.floor(Math.random() * availableForFakeAnswer.length)];
              const newFakeAnswer = { ...randomFakeReplacement };
              
              newFakeAnswer.type = 'fake answer';
              newFakeAnswer.category = `fake answers - ${randomFakeReplacement.category}`;
              newFakeAnswer.q_type = 'fake';
              
              shuffledQuestions[fakeAnswerItem.index] = newFakeAnswer;
              if (randomFakeReplacement.answer?.trim()) {
                selectedFakeAnswers.add(randomFakeReplacement.answer.trim().toLowerCase());
              }
            }
          }
        });
        
        onQuestionsChange(shuffledQuestions);
        
        // Persist category locks for fake answers after shuffle
        const updatedCategoryLocks = new Set<string>();
        shuffledQuestions.forEach((question, index) => {
          if (question.type === 'fake answer') {
            const questionId = getQuestionId(question, index);
            // Check if this fake answer was category locked before shuffle
            const originalFakeAnswer = unlockedFakeAnswersWithIndex.find(item => item.index === index);
            if (originalFakeAnswer) {
              const originalQuestionId = getQuestionId(originalFakeAnswer.question, originalFakeAnswer.index);
              if (lockedCategories.has(originalQuestionId)) {
                updatedCategoryLocks.add(questionId);
              }
            }
          }
        });
        
        // Update category locks state and localStorage
        setLockedCategories(updatedCategoryLocks);
        localStorage.setItem('lockedCategories', JSON.stringify([...updatedCategoryLocks]));
      }
      // If no questions available from same category, do nothing (skip)
      return;
    } else if (shuffleInfo.shuffleMode === 'reorder') {
      // Reorder unlocked questions
      const shuffledUnlocked = [...unlockedQuestionsWithIndex].sort(() => Math.random() - 0.5);
      
      unlockedQuestionsWithIndex.forEach((originalItem, idx) => {
        shuffledQuestions[originalItem.index] = shuffledUnlocked[idx].question;
      });
      
      // Now handle fake answer shuffling for reorder mode
      // Use the helper function to get all real answers
      const allRealAnswers = getAllRealAnswers(shuffledQuestions);
      
      // Keep track of fake answers selected to avoid duplicates among fake answers
      const selectedFakeAnswers = new Set<string>();
      
      // PRIORITY 1: Locked fake answers are never changed - add their answers to prevent duplication
      lockedFakeAnswersWithIndex.forEach(lockedFakeItem => {
        if (lockedFakeItem.question.answer?.trim()) {
          selectedFakeAnswers.add(lockedFakeItem.question.answer.trim().toLowerCase());
        }
      });
      
      // Define hashes for locked items
      const lockedRealQuestionHashes = new Set(
        lockedQuestionsWithIndex
          .filter(item => item.question.type !== 'fake answer')
          .map(item => getContentHashForShuffling(item.question))
      );
      
      const lockedFakeAnswerHashes = new Set(
        lockedFakeAnswersWithIndex.map(item => getContentHashForShuffling(item.question))
      );
      
      // PRIORITY 2: Process unlocked fake answers (includes category-locked ones)
      unlockedFakeAnswersWithIndex.forEach(fakeAnswerItem => {
        const fakeQuestionId = getQuestionId(fakeAnswerItem.question, fakeAnswerItem.index);
        
        // Skip fake answers that are currently being edited - they should not be affected by shuffling
        if (editingQuestions.has(fakeQuestionId)) {
          return; // Skip this fake answer, keep it unchanged
        }
        
        // Skip fake answers that are manual and haven't been saved yet
        if (fakeAnswerItem.question.category === 'fake answers - manual' && 
            (!fakeAnswerItem.question.answer || fakeAnswerItem.question.answer.trim() === '')) {
          return; // Skip manual fake answers that haven't been filled in
        }
        
        const isCategoryLocked = lockedCategories.has(fakeQuestionId);
        
        if (isCategoryLocked) {
          // If category is locked, only shuffle the answer within the same category
          const lockedCategory = fakeAnswerItem.question.category?.replace('fake answers - ', '') || '';
          const availableForFakeAnswer = allQuestionsPool.filter(q => {
            const contentHash = getContentHashForShuffling(q);
            return q.category === lockedCategory &&
                   !lockedRealQuestionHashes.has(contentHash) && // Don't use locked real questions as sources
                   !lockedFakeAnswerHashes.has(contentHash) && // Don't use locked fake answers as sources
                   !allRealAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate real answers
                   !selectedFakeAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate fake answers
                   q.type !== 'fake answer'; // Don't use existing fake answers
          });
          
          if (availableForFakeAnswer.length > 0) {
            const randomFakeReplacement = availableForFakeAnswer[Math.floor(Math.random() * availableForFakeAnswer.length)];
            const newFakeAnswer = { ...randomFakeReplacement };
            
            newFakeAnswer.type = 'fake answer';
            newFakeAnswer.category = `fake answers - ${randomFakeReplacement.category}`;
            newFakeAnswer.q_type = 'fake';
            
            shuffledQuestions[fakeAnswerItem.index] = newFakeAnswer;
            if (randomFakeReplacement.answer?.trim()) {
              selectedFakeAnswers.add(randomFakeReplacement.answer.trim().toLowerCase());
            }
          }
        } else {
          // Category not locked, can change both category and answer
          const availableForFakeAnswer = allQuestionsPool.filter(q => {
            const contentHash = getContentHashForShuffling(q);
            return !lockedRealQuestionHashes.has(contentHash) && // Don't use locked real questions as sources
                   !lockedFakeAnswerHashes.has(contentHash) && // Don't use locked fake answers as sources
                   !allRealAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate real answers
                   !selectedFakeAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate fake answers
                   q.type !== 'fake answer'; // Don't use existing fake answers
          });
          
          if (availableForFakeAnswer.length > 0) {
            const randomFakeReplacement = availableForFakeAnswer[Math.floor(Math.random() * availableForFakeAnswer.length)];
            const newFakeAnswer = { ...randomFakeReplacement };
            
            newFakeAnswer.type = 'fake answer';
            newFakeAnswer.category = `fake answers - ${randomFakeReplacement.category}`;
            newFakeAnswer.q_type = 'fake';
            
            shuffledQuestions[fakeAnswerItem.index] = newFakeAnswer;
            if (randomFakeReplacement.answer?.trim()) {
              selectedFakeAnswers.add(randomFakeReplacement.answer.trim().toLowerCase());
            }
          }
        }
      });
      
      onQuestionsChange(shuffledQuestions);
      
      // Persist category locks for fake answers after shuffle
      const updatedCategoryLocks = new Set<string>();
      shuffledQuestions.forEach((question, index) => {
        if (question.type === 'fake answer') {
          const questionId = getQuestionId(question, index);
          // Check if this fake answer was category locked before shuffle
          const originalFakeAnswer = unlockedFakeAnswersWithIndex.find(item => item.index === index);
          if (originalFakeAnswer) {
            const originalQuestionId = getQuestionId(originalFakeAnswer.question, originalFakeAnswer.index);
            if (lockedCategories.has(originalQuestionId)) {
              updatedCategoryLocks.add(questionId);
            }
          }
        }
      });
      
      // Update category locks state and localStorage
      setLockedCategories(updatedCategoryLocks);
      localStorage.setItem('lockedCategories', JSON.stringify([...updatedCategoryLocks]));
      
      return;
    } else if (shuffleInfo.shuffleMode === 'fresh') {
      // Fresh shuffle with category-aware replacement
      const lockedRealQuestionHashes = new Set(
        lockedQuestionsWithIndex
          .filter(item => item.question.type !== 'fake answer')
          .map(item => getContentHashForShuffling(item.question))
      );
      
      const lockedFakeAnswerHashes = new Set(
        lockedFakeAnswersWithIndex.map(item => getContentHashForShuffling(item.question))
      );
      
      const originalUnlockedHashes = new Set(
        unlockedQuestionsWithIndex.map(item => getContentHashForShuffling(item.question))
      );
      
      const usedQuestionHashes = new Set<string>();
      
      unlockedQuestionsWithIndex.forEach((unlockedItem) => {
        const targetCategory = unlockedItem.question.category;
            const availableFromSameCategory = allQuestionsPool.filter(q => {
        const contentHash = getContentHashForShuffling(q);
        const answerText = q.answer?.trim().toLowerCase() || '';
        return q.category === targetCategory && 
               !lockedRealQuestionHashes.has(contentHash) && 
               !lockedFakeAnswerHashes.has(contentHash) &&
               !originalUnlockedHashes.has(contentHash) &&
               !usedQuestionHashes.has(contentHash) &&
               !lockedFakeAnswerTexts.has(answerText) && // Prevent duplication with locked fake answers
               q.type !== 'fake answer';
      });
        
        if (availableFromSameCategory.length > 0) {
          const randomQuestion = availableFromSameCategory[Math.floor(Math.random() * availableFromSameCategory.length)];
          shuffledQuestions[unlockedItem.index] = randomQuestion;
          usedQuestionHashes.add(getContentHashForShuffling(randomQuestion));
        }
      });
      
      // Now handle fake answer shuffling for fresh mode
      // Use the helper function to get all real answers
      const allRealAnswers = getAllRealAnswers(shuffledQuestions);
      
      // Keep track of fake answers selected to avoid duplicates among fake answers
      const selectedFakeAnswers = new Set<string>();
      
      // PRIORITY 1: Locked fake answers are never changed - add their answers to prevent duplication
      lockedFakeAnswersWithIndex.forEach(lockedFakeItem => {
        if (lockedFakeItem.question.answer?.trim()) {
          selectedFakeAnswers.add(lockedFakeItem.question.answer.trim().toLowerCase());
        }
      });
      
      // PRIORITY 2: Process unlocked fake answers (includes category-locked ones)
      unlockedFakeAnswersWithIndex.forEach(fakeAnswerItem => {
        const fakeQuestionId = getQuestionId(fakeAnswerItem.question, fakeAnswerItem.index);
        
        // Skip fake answers that are currently being edited - they should not be affected by shuffling
        if (editingQuestions.has(fakeQuestionId)) {
          return; // Skip this fake answer, keep it unchanged
        }
        
        // Skip fake answers that are manual and haven't been saved yet
        if (fakeAnswerItem.question.category === 'fake answers - manual' && 
            (!fakeAnswerItem.question.answer || fakeAnswerItem.question.answer.trim() === '')) {
          return; // Skip manual fake answers that haven't been filled in
        }
        
        const isCategoryLocked = lockedCategories.has(fakeQuestionId);
        
        if (isCategoryLocked) {
          // If category is locked, only shuffle the answer within the same category
          const lockedCategory = fakeAnswerItem.question.category?.replace('fake answers - ', '') || '';
          const availableForFakeAnswer = allQuestionsPool.filter(q => {
            const contentHash = getContentHashForShuffling(q);
            return q.category === lockedCategory &&
                   !lockedRealQuestionHashes.has(contentHash) && // Don't use locked real questions as sources
                   !lockedFakeAnswerHashes.has(contentHash) && // Don't use locked fake answers as sources
                   !allRealAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate real answers
                   !selectedFakeAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate fake answers
                   q.type !== 'fake answer'; // Don't use existing fake answers
          });
          
          if (availableForFakeAnswer.length > 0) {
            const randomFakeReplacement = availableForFakeAnswer[Math.floor(Math.random() * availableForFakeAnswer.length)];
            const newFakeAnswer = { ...randomFakeReplacement };
            
            newFakeAnswer.type = 'fake answer';
            newFakeAnswer.category = `fake answers - ${randomFakeReplacement.category}`;
            newFakeAnswer.q_type = 'fake';
            
            shuffledQuestions[fakeAnswerItem.index] = newFakeAnswer;
            if (randomFakeReplacement.answer?.trim()) {
              selectedFakeAnswers.add(randomFakeReplacement.answer.trim().toLowerCase());
            }
          }
        } else {
          // Category not locked, can change both category and answer
          const availableForFakeAnswer = allQuestionsPool.filter(q => {
            const contentHash = getContentHashForShuffling(q);
            return !lockedRealQuestionHashes.has(contentHash) && // Don't use locked real questions as sources
                   !lockedFakeAnswerHashes.has(contentHash) && // Don't use locked fake answers as sources
                   !allRealAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate real answers
                   !selectedFakeAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate fake answers
                   q.type !== 'fake answer'; // Don't use existing fake answers
          });
          
          if (availableForFakeAnswer.length > 0) {
            const randomFakeReplacement = availableForFakeAnswer[Math.floor(Math.random() * availableForFakeAnswer.length)];
            const newFakeAnswer = { ...randomFakeReplacement };
            
            newFakeAnswer.type = 'fake answer';
            newFakeAnswer.category = `fake answers - ${randomFakeReplacement.category}`;
            newFakeAnswer.q_type = 'fake';
            
            shuffledQuestions[fakeAnswerItem.index] = newFakeAnswer;
            if (randomFakeReplacement.answer?.trim()) {
              selectedFakeAnswers.add(randomFakeReplacement.answer.trim().toLowerCase());
            }
          }
        }
      });
      
      onQuestionsChange(shuffledQuestions);
      
      // Persist category locks for fake answers after shuffle
      const updatedCategoryLocks = new Set<string>();
      shuffledQuestions.forEach((question, index) => {
        if (question.type === 'fake answer') {
          const questionId = getQuestionId(question, index);
          // Check if this fake answer was category locked before shuffle
          const originalFakeAnswer = unlockedFakeAnswersWithIndex.find(item => item.index === index);
          if (originalFakeAnswer) {
            const originalQuestionId = getQuestionId(originalFakeAnswer.question, originalFakeAnswer.index);
            if (lockedCategories.has(originalQuestionId)) {
              updatedCategoryLocks.add(questionId);
            }
          }
        }
      });
      
      // Update category locks state and localStorage
      setLockedCategories(updatedCategoryLocks);
      localStorage.setItem('lockedCategories', JSON.stringify([...updatedCategoryLocks]));
      
      return;
    }
  };
};
