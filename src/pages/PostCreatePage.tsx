import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ROUTES } from "@/constants/routes";
import { usePostMutations } from "@/features/post/hooks/usePosts";
import { PostForm } from "@/features/post/components/PostForm";
import type { PostPayload } from "@/features/post/types/post.types";
import { ApiError } from "@/config/http/apiError";

export default function PostCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { createPost } = usePostMutations();

  const handleSubmit = async (payload: PostPayload, asDraft = false) => {
    try {
      const post = await createPost.mutateAsync({ payload, asDraft });
      toast.success(asDraft ? t("post.draftSaved") : t("post.publishSuccess"));
      navigate(asDraft ? ROUTES.MY_POSTS : ROUTES.POST_DETAIL(post.id));
    } catch (err) {
      toast.error(getErrorMessage(err));
      return err instanceof ApiError ? err.fieldErrors : undefined;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <PageHeader
        title={t("post.createPost")}
        description={t("post.myPostsDesc")}
      />
      <div className="mt-6">
        <PostForm onSubmit={handleSubmit} isSubmitting={createPost.isPending} />
      </div>
    </div>
  );
}
