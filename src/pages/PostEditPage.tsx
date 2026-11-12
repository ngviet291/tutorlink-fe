import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Spinner } from "@/shared/components/ui/Spinner";
import { ErrorState } from "@/shared/components/ui/EmptyState";
import { ROUTES } from "@/constants/routes";
import {
  usePostDetail,
  usePostMutations,
} from "@/features/post/hooks/usePosts";
import { PostForm } from "@/features/post/components/PostForm";
import type { PostPayload } from "@/features/post/types/post.types";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { ApiError } from "@/config/http/apiError";

export default function PostEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { id = "" } = useParams<{ id: string }>();
  const user = useAppSelector((s) => s.auth.user);

  const { data: post, isLoading, isError } = usePostDetail(id, Boolean(user));

  const { updatePost, publish } = usePostMutations();

  const handleSubmit = async (payload: PostPayload, asDraft = false) => {
    try {
      await updatePost.mutateAsync({
        id,
        payload,
      });
      if (!asDraft) {
        await publish.mutateAsync(id);
      }

      toast.success(asDraft ? t("post.draftSaved") : t("post.publishSuccess"));

      navigate(asDraft ? ROUTES.MY_POSTS : ROUTES.POST_DETAIL(id));
    } catch (err) {
      toast.error(getErrorMessage(err));

      return err instanceof ApiError ? err.fieldErrors : undefined;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !post) {
    return <ErrorState message={t("post.notFound")} />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <PageHeader title={t("post.editPost")} />

      <div className="mt-6">
        <PostForm
          defaultValues={post}
          onSubmit={handleSubmit}
          isSubmitting={updatePost.isPending}
        />
      </div>
    </div>
  );
}
