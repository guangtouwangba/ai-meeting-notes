export interface Meeting {
  id: string;
  title: string;
  date: Date;
  transcription: string;
  notes: string;
  audioUrl: string | null;
  summary: string | null;
}