import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { http } from "@/config/axiosClient";
import { mockConfig } from "@/config/env";
import { delay } from "@/mocks/session";
import { subjects, nextId } from "@/mocks/db";
import { subjectService } from "../service/subject.service";
import type { SubjectPayload, SubjectResponse } from "../types/subject.types";

const USE_MOCK = mockConfig.subject;

export function useSubjects() {
  return useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: subjectService.getAll,
    staleTime: 10 * 60 * 1000,
  });
}

export function useSubjectMutations() {
  const qc = useQueryClient();
  const refresh = () =>
    qc.invalidateQueries({ queryKey: queryKeys.subjects.all });

  const create = useMutation({
    mutationFn: async (payload: SubjectPayload) => {
      if (USE_MOCK) {
        await delay();
        const subject: SubjectResponse = {
          id: nextId("subj"),
          name: payload.name,
          description: payload.description,
          category: payload.category ?? "Khác",
        };
        subjects.push(subject);
        return subject;
      }
      return http.post<SubjectResponse>("/v1/subjects", {
        ...payload,
        category: payload.category ?? "Khác",
      });
    },
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: SubjectPayload;
    }) => {
      if (USE_MOCK) {
        await delay();
        const subject = subjects.find((item) => item.id === id);
        if (subject) Object.assign(subject, payload);
        return subject;
      }
      return http.put<SubjectResponse>(`/v1/subjects/${id}`, {
        ...payload,
        category: payload.category ?? "Khác",
      });
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        await delay();
        const index = subjects.findIndex((item) => item.id === id);
        if (index >= 0) subjects.splice(index, 1);
        return;
      }
      await http.delete(`/v1/subjects/${id}`);
    },
    onSuccess: refresh,
  });

  return { create, update, remove };
}
