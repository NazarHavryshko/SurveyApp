export type SurveyType = 'SingleChoice' | 'MultipleChoice' | 'Numeric';
export type SurveyStatus = 'Active' | 'Inactive' | 'Pending';

export interface SurveyOption {
  optionId: number;
  optionText: string;
  orderIndex: number;
}

export interface Survey {
  surveyId: number;
  questionText: string;
  surveyType: SurveyType;
  status: SurveyStatus;
  domainName: string;
  topicName: string;
  regionName: string | null;
  createdAt: string;
  options: SurveyOption[];
}

export interface UserProfile {
  userId: string;
  email: string;
  userType: 'Anonymous' | 'User' | 'Moderator';
  answersCount: number;
  gender: string | null;
  birthYear: number | null;
  regionName: string | null;
  occDomainName: string | null;
  occupationName: string | null;
  hobbyName: string | null;
}

export interface OptionStat {
  label: string;
  count: number;
  percentage: number;
}

export interface SurveyDiagramData {
  surveyId: number;
  questionText: string;
  surveyType: SurveyType;
  totalResponses: number;
  averageAnsweredMs: number;
  stats: OptionStat[];
}

export interface SurveyDomain {
  domainId: number;
  domainName: string;
}

export interface SurveyTopic {
  topicId: number;
  domainId: number;
  topicName: string;
}

export type PreferredTopicCount = 5 | 6 | 7 | 8;

export interface SavedSurveyFilters {
  domainId: number;
  domainName: string;
  topicId: number;
  topicName: string;
  preferredCount: PreferredTopicCount; // Скільки питань з обраної теми (5..8)
  randomCount: number;                 // Скільки рандомних питань (5..2)
  updatedAt: string;
}

export interface RandomSurveyOption {
  optionId: number;
  optionText: string;
}

export interface RandomSurveyDto {
  surveyId: number;
  surveyText: string;
  surveyType: string; // 'SingleChoice' | 'MultipleChoice' | 'Numeric' | 'Open'
  topicId: number;
  options: RandomSurveyOption[];
}

export interface SubmitResponseRequest {
  surveyId: number;
  selectedOptionIds: number[];
  openAnswer: string | null;
  isPreferredDomain: boolean;
}