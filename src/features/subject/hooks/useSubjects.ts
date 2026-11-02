import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { subjectService } from "../service/subject.service";

export function useSubjects() {
  return useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: subjectService.getAll,
    staleTime: 10 * 60 * 1000,
  });
}
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/config/axiosClient";
import { env, mockConfig } from "@/config/env";
import { delay } from "@/mocks/session";
import { subjects, nextId } from "@/mocks/db";
import type { SubjectResponse } from "../types/subject.types";

const USE_MOCK = mockConfig.subject;

export function useSubjectMutations() {
  const qc = useQueryClient();
  const refresh = () =>
    qc.invalidateQueries({ queryKey: queryKeys.subjects.all });

  const create = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      if (USE_MOCK) {
        await delay();
        const s: SubjectResponse = {
          id: nextId("subj"),
          name: payload.name,
          description: payload.description,
        };
        subjects.push(s);
        return s;
      }
      return http.post<SubjectResponse>("/v1/subjects", payload);
    },
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { name: string; description?: string };
    }) => {
      if (USE_MOCK) {
        await delay();
        const s = subjects.find((x) => x.id === id);
        if (s) Object.assign(s, payload);
        return s;
      }
      return http.put<SubjectResponse>(`/v1/subjects/${id}`, payload);
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        await delay();
        const idx = subjects.findIndex((x) => x.id === id);
        if (idx >= 0) subjects.splice(idx, 1);
        return;
      }
      return http.delete(`/v1/subjects/${id}`);
    },
    onSuccess: refresh,
  });

  return { create, update, remove };
}
