import { Question } from '../../types';

export const getShuffleInfo = (
  questions: Question[],
  allQuestionsPool: Question[],
  lockedQuestions: Set<string>,
  getQuestionId: (question: Question, index: number) => string,
  getContentHash: (question: Question) => string
) => {
  const unlockedCount = questions.filter((q, i) => !lockedQuestions.has(getQuestionId(q, i)) && q.type !== 'fake answer').length;
  const fakeAnswerCount = questions.filter(q => q.type === 'fake answer').length;
  const lockedCount = questions.filter((q, i) => lockedQuestions.has(getQuestionId(q, i))).length;
  const totalShuffleableCount = unlockedCount + fakeAnswerCount;
  
  const lockedQuestionHashes = questions
    .filter((q, i) => lockedQuestions.has(getQuestionId(q, i)))
    .map(q => getContentHash(q));
  
  const unlockedQuestions = questions.filter((q, i) => !lockedQuestions.has(getQuestionId(q, i)));
  const unlockedQuestionHashes = unlockedQuestions.map(q => getContentHash(q));
  
  let totalAvailableFromCategories = 0;
  let questionsWithCategoryOptions = 0;
  
  unlockedQuestions.forEach(unlockedQuestion => {
    const availableFromSameCategory = allQuestionsPool.filter(q => {
      const contentHash = getContentHash(q);
      return q.category === unlockedQuestion.category && 
             !lockedQuestionHashes.includes(contentHash) && 
             !unlockedQuestionHashes.includes(contentHash) &&
             q.type !== 'fake answer';
    });
    
    if (availableFromSameCategory.length > 0) {
      totalAvailableFromCategories += availableFromSameCategory.length;
      questionsWithCategoryOptions++;
    }
  });
  
  return {
    unlockedCount,
    lockedCount,
    fakeAnswerCount,
    totalShuffleableCount,
    availableFromPool: totalAvailableFromCategories,
    questionsWithCategoryOptions,
    canShuffle: totalShuffleableCount > 0 && (totalShuffleableCount > 1 || totalAvailableFromCategories > 0),
    shuffleMode: 
      totalShuffleableCount === 1 && totalAvailableFromCategories === 0 ? 'disabled' :
      totalShuffleableCount === 1 && totalAvailableFromCategories > 0 ? 'replace' :
      totalAvailableFromCategories === 0 ? 'reorder' : 'fresh'
  };
};

export const getShuffleTooltip = (shuffleInfo: ReturnType<typeof getShuffleInfo>) => {
  const fakeAnswerText = shuffleInfo.fakeAnswerCount > 0 ? ' (including fake answers)' : '';
  switch (shuffleInfo.shuffleMode) {
    case 'disabled':
      return `Cannot shuffle - only 1 question with no alternatives${fakeAnswerText}`;
    case 'replace':
      return `Replace single question with alternative from same category${fakeAnswerText}`;
    case 'reorder':
      return `Reorder questions (no new questions available)${fakeAnswerText}`;
    case 'fresh':
      return `Fresh shuffle with new questions from pool${fakeAnswerText}`;
    default:
      return `Shuffle questions (category-aware)${fakeAnswerText}`;
  }
};

export const getContentHashForShuffling = (question: Question) => {
  if (question.type === 'fake answer') {
    return `${question.question?.trim() || ''}|${question.answer?.trim() || ''}`;
  }
  
  const contentParts = [
    `type:${question.type || 'unknown'}`,
    `q:${question.question?.trim() || 'empty'}`,
    `cat:${question.category?.trim() || 'no_category'}`,
    `qtype:${question.q_type?.trim() || 'none'}`,
    `img:${question.image?.trim() || 'none'}`,
    `long:${question.is_long?.toString() || 'false'}`
  ];
  
  if (question.type.toLowerCase() !== 'multiple choice' && question.type.toLowerCase() !== 'matching') {
    contentParts.push(`ans:${question.answer?.trim() || 'no_answer'}`);
  }
  
  if (question.type.toLowerCase() === 'multiple choice') {
    contentParts.push(
      `a:${question.a?.trim() || 'empty_a'}`,
      `b:${question.b?.trim() || 'empty_b'}`,
      `c:${question.c?.trim() || 'empty_c'}`,
      `d:${question.d?.trim() || 'empty_d'}`,
      `e:${question.e?.trim() || 'empty_e'}`
    );
  }
  
  return contentParts.join('||');
};
