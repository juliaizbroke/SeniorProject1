import { Question } from '../types';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  Chip,
  Stack,
  FormControl,
  InputLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface QuestionEditorProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
}

const QuestionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

export default function QuestionEditor({ questions, onQuestionsChange }: QuestionEditorProps) {
  const handleQuestionChange = (index: number, field: keyof Question, value: string | boolean) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    onQuestionsChange(updatedQuestions);
  };

  const getQuestionChoices = (question: Question) => {
    if (question.type.toLowerCase() === 'multiple choice') {
      return ['a', 'b', 'c', 'd', 'e'].map(choice => ({
        key: choice,
        value: question[choice as keyof Question] || ''
      }));
    }
    return [];
  };

  return (
    <Stack spacing={3}>
      {questions.map((question, index) => (
        <QuestionPaper key={`question-${index}-${question.type}`} elevation={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Stack direction="row" spacing={1}>
              <Chip
                label={question.type}
                color="primary"
                variant="outlined"
                size="small"
              />
              <Chip
                label={question.category}
                color="success"
                variant="outlined"
                size="small"
              />
            </Stack>
            <Typography color="text.secondary">
              Question {index + 1}
            </Typography>
          </Box>

          <Stack spacing={3}>
            <TextField
              label="Question Text"
              value={question.question || ''}
              onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
              multiline
              rows={3}
              fullWidth
              variant="outlined"
            />

            {question.type.toLowerCase() === 'multiple choice' && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Options
                </Typography>
                <Stack spacing={2}>
                  {getQuestionChoices(question).map(({ key, value }) => (
                    <TextField
                      key={`choice-${key}`}
                      label={`Option ${key.toUpperCase()}`}
                      value={value}
                      onChange={(e) => handleQuestionChange(index, key as keyof Question, e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel>Answer</InputLabel>
              {question.type.toLowerCase() === 'multiple choice' ? (
                <Select
                  value={question.answer || ''}
                  onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                  label="Answer"
                >
                  {['A', 'B', 'C', 'D', 'E'].map((choice) => (
                    <MenuItem key={`answer-${choice}`} value={choice}>
                      {choice}
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                <TextField
                  value={question.answer || ''}
                  onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                  fullWidth
                  variant="outlined"
                  label="Answer"
                />
              )}
            </FormControl>

            {question.type.toLowerCase() === 'multiple choice' && (
              <FormControl fullWidth>
                <InputLabel>Is Long Question?</InputLabel>
                <Select
                  value={question.is_long ? 'true' : 'false'}
                  onChange={(e) => handleQuestionChange(index, 'is_long', e.target.value === 'true')}
                  label="Is Long Question?"
                >
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                </Select>
              </FormControl>
            )}

            {question.image && (
              <TextField
                label="Image Path"
                value={question.image}
                onChange={(e) => handleQuestionChange(index, 'image', e.target.value)}
                fullWidth
                variant="outlined"
              />
            )}
          </Stack>
        </QuestionPaper>
      ))}
    </Stack>
  );
} 