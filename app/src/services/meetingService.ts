import { Meeting } from '../models/Meeting';
import { createMeetingAPI, fetchMeetings } from './api'; // 导入 API 函数

export const createMeeting = (meetings: Meeting[]): Meeting => {
  return createMeetingAPI(meetings); // 调用 API 函数
};

export const getMeetings = (): Meeting[] => {
  return fetchMeetings(); // 调用 API 函数
};
