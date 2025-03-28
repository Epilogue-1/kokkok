import { showToast } from "@/components/ToastConfig";
import { NOTIFICATION_TYPE } from "@/types/Notification.interface";
import type { UserProfile } from "@/types/User.interface";
import { shortenMessage } from "@/utils/formMessage";
import {
  acceptFriendRequest,
  checkFriendRequest,
  checkFriendRequestWithUserId,
  createFriendRequest,
  createNotification,
  deleteFriendRequest,
  deleteFriendRequestWithUserId,
  getCurrentUser,
  unfriend,
} from "@/utils/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateProps {
  toUserId: string;
}

interface AcceptProps {
  requestId?: number;
  fromUserId: string;
}

interface RefuseProps {
  requestId: number;
  fromUserId: string;
}

interface UnfriendProps {
  toUserId: string;
}

interface CancelRequestProps {
  toUserId: string;
}

interface PokeProps {
  friend: UserProfile;
}

class NoRequestError extends Error {
  from: string;

  constructor(message: string, from: string) {
    super(message);
    this.from = from;
  }
}

const useManageFriend = () => {
  const queryClient = useQueryClient();

  // 친구 요청 생성
  const useCreateRequest = () => {
    const { mutate, isPending } = useMutation<CreateProps, Error, CreateProps>({
      mutationFn: async ({ toUserId }) => {
        await createFriendRequest(toUserId);
        await createNotification({
          to: toUserId,
          type: NOTIFICATION_TYPE.FRIEND,
          data: { isAccepted: false },
        });
        return { toUserId };
      },
      onSuccess: ({ toUserId }) => {
        queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
        queryClient.invalidateQueries({ queryKey: ["friends"] });
        queryClient.invalidateQueries({ queryKey: ["search", "users"] });
        queryClient.invalidateQueries({ queryKey: ["relation", toUserId] });
      },
      onError: (error) => {
        console.error("친구 요청 생성 실패:", error);
        showToast("fail", "요청 보내기에 실패했어요!");
      },
    });
    return { mutate, isPending };
  };

  // 친구 요청 수락
  const useAcceptRequest = () => {
    const { mutate, isPending } = useMutation<AcceptProps, Error, AcceptProps>({
      mutationFn: async ({ requestId, fromUserId }) => {
        // 친구 요청이 그사이 취소되었는지 확인
        const hasFriendRequest = requestId
          ? await checkFriendRequest(requestId)
          : await checkFriendRequestWithUserId(fromUserId);
        if (!hasFriendRequest) {
          throw new NoRequestError(
            "친구 요청이 유효하지 않습니다.",
            fromUserId,
          );
        }

        await acceptFriendRequest(fromUserId, requestId);
        await createNotification({
          to: fromUserId,
          type: NOTIFICATION_TYPE.FRIEND,
          data: { isAccepted: true },
        });
        return { fromUserId };
      },
      onSuccess: ({ fromUserId }) => {
        queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
        queryClient.invalidateQueries({ queryKey: ["friends"] });
        queryClient.invalidateQueries({ queryKey: ["relation", fromUserId] });
      },
      onError: (error) => {
        if (error instanceof NoRequestError) {
          // 친구 요청이 취소되어 발생한 에러라면 관련된 값 다시 불러오도록
          queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
          queryClient.invalidateQueries({ queryKey: ["relation", error.from] });
        }
        console.error("친구 요청 수락 실패:", error);
        showToast("fail", "요청 수락에 실패했어요!");
      },
    });

    return { mutate, isPending };
  };

  // 친구 요청 거절
  const useRefuseRequest = () => {
    const { mutate, isPending } = useMutation<RefuseProps, Error, RefuseProps>({
      mutationFn: async ({ requestId, fromUserId }) => {
        await deleteFriendRequest(requestId);
        return { requestId, fromUserId };
      },
      onSuccess: ({ fromUserId }) => {
        queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
        queryClient.invalidateQueries({ queryKey: ["relation", fromUserId] });
      },
      onError: (error) => {
        console.error("친구 요청 거절 실패:", error);
        showToast("fail", "요청 거절에 실패했어요!");
      },
    });
    return { mutate, isPending };
  };

  // 친구 끊기
  const useUnfriend = () => {
    const { mutate, isPending } = useMutation<
      UnfriendProps,
      Error,
      UnfriendProps
    >({
      mutationFn: async ({ toUserId }) => {
        await unfriend(toUserId);
        return { toUserId };
      },
      onSuccess: ({ toUserId }) => {
        queryClient.invalidateQueries({ queryKey: ["friends"] });
        queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
        queryClient.invalidateQueries({ queryKey: ["relation", toUserId] });
      },
      onError: (error) => {
        console.error("친구 끊기 실패:", error);
        showToast("fail", "친구 끊기를 실패했어요!");
      },
    });
    return { mutate, isPending };
  };

  // 친구 요청 취소
  const useCancelRequest = () => {
    const { mutate, isPending } = useMutation<
      CancelRequestProps,
      Error,
      CancelRequestProps
    >({
      mutationFn: async ({ toUserId }) => {
        // 훅에서 유저 정보를 가져오는 걸로 구현
        const user = await getCurrentUser();
        await deleteFriendRequestWithUserId(user.id, toUserId);
        return { toUserId };
      },
      onSuccess: ({ toUserId }) => {
        queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
        queryClient.invalidateQueries({ queryKey: ["relation", toUserId] });
        // 친구 요청 취소 토스트 모달로 알림
        showToast("success", "친구 요청을 취소했어요!");
      },
      onError: (error) => {
        console.error("친구 요청 취소 실패:", error);
        showToast("fail", "친구 요청 취소에 실패했어요!");
      },
    });
    return { mutate, isPending };
  };

  // 친구 콕 찌르기
  const usePoke = ({ onError }: { onError?: () => void }) => {
    const { mutate } = useMutation<PokeProps, Error, PokeProps>({
      mutationFn: async ({ friend }) => {
        await createNotification({
          to: friend.id,
          type: NOTIFICATION_TYPE.POKE,
        });

        return { friend };
      },
      onSuccess: ({ friend }) => {
        queryClient.invalidateQueries({ queryKey: ["poke", friend.id] });
        showToast(
          "success",
          `👈 ${shortenMessage(friend.username, 10)}님을 콕! 찔렀어요`,
        );
      },
      onError: (error) => {
        console.error("콕 찌르기 실패:", error);
        showToast("fail", "콕 찌르기에 실패했어요!");
        onError?.();
      },
    });

    return { mutate };
  };

  return {
    useCreateRequest,
    useAcceptRequest,
    useRefuseRequest,
    useUnfriend,
    useCancelRequest,
    usePoke,
  };
};

export default useManageFriend;
