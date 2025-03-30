import useManageFriend from "@/hooks/useManageFriend";
import { useModal } from "@/hooks/useModal";
import { RELATION_TYPE, type RelationType } from "@/types/Friend.interface";
import { Text, TouchableOpacity, View } from "react-native";

interface FriendRequestOptionsModalProps {
  userId: string;
  relation: RelationType;
}

export const FriendRequestOptionsModal: React.FC<
  FriendRequestOptionsModalProps
> = ({ userId, relation }) => {
  const { useUnfriend, useAcceptRequest, useCreateRequest } = useManageFriend();
  const { mutate: handleUnfriend } = useUnfriend();
  const { mutate: handleAccept } = useAcceptRequest();
  const { mutate: handleCreate } = useCreateRequest();
  const { closeModal } = useModal();

  const config = {
    [RELATION_TYPE.FRIEND]: {
      label: "친구 끊기",
      onPress: () => handleUnfriend({ toUserId: userId }),
    },
    [RELATION_TYPE.ASKING]: {
      label: "친구 요청 취소",
      onPress: () => handleUnfriend({ toUserId: userId }),
    },
    [RELATION_TYPE.ASKED]: {
      label: "친구 요청 수락",
      onPress: () => handleAccept({ fromUserId: userId }),
    },
    [RELATION_TYPE.NONE]: {
      label: "친구 요청",
      onPress: () => handleCreate({ toUserId: userId }),
    },
  };

  const { label, onPress } = config[relation];

  return (
    <View className="items-center rounded-t-xl bg-white">
      <TouchableOpacity
        className="h-[82px] w-full items-center justify-center"
        onPress={() => {
          onPress();
          closeModal();
        }}
      >
        <Text className="title-2 text-gray-90">{label}</Text>
      </TouchableOpacity>
    </View>
  );
};
