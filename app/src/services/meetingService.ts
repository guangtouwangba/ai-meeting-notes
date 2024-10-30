import { Meeting } from '../models/Meeting';
import { createMeeting, fetchMeetings, CreateMeetingRequest } from './api'; // 导入 API 函数

export const createMeetingAPI = async (meetings: CreateMeetingRequest): Promise<Meeting> => {
  return await createMeeting(meetings); // 调用 API 函数
};

export const getMeetings = (): Meeting[] => {
  return fetchMeetings(); // 调用 API 函数
};
