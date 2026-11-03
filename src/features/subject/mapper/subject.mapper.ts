import type { CursorResponse } from "@/shared/types/common.dto";
import type { SubjectResponse as SubjectResponseDto } from "../types/subject.dto";
import type { SubjectResponse } from "../types/subject.types";

export function toSubject(dto: SubjectResponseDto): SubjectResponse {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? undefined,
    category: dto.category,
  };
}

export function toCursorPage<TDto, TModel>(
  dto: CursorResponse<TDto>,
  mapItem: (item: TDto) => TModel,
): CursorResponse<TModel> {
  return {
    content: (dto.content ?? []).map(mapItem),
    nextCursor: dto.nextCursor,
    hasNext: dto.hasNext ?? false,
  };
}
