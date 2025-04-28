import Icons from "@/constants/icons";
import { Text, TouchableOpacity, View } from "react-native";

interface ConfirmDeleteProps {
  onClose: () => void;
  onDelete: () => void;
}

export const DeleteModal: React.FC<ConfirmDeleteProps> = ({
  onClose,
  onDelete,
}) => {
  return (
    <View className="px-7">
      <View className="items-center rounded-xl bg-white p-6">
        <Icons.TrashCanIcon width={30} height={38} />
        <Text className="title-3 mt-4 text-center text-gray-90">
          삭제하면 되돌릴 수 없어요{"\n"}그래도 삭제하시겠어요?
        </Text>
        <View className="mt-5 h-[52px] flex-row items-center gap-5">
          <TouchableOpacity
            onPress={onClose}
            className="h-full grow items-center justify-center rounded-[8px] bg-gray-40"
          >
            <Text className="title-3 text-white">취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            className="h-full grow items-center justify-center rounded-[8px] bg-primary"
          >
            <Text className="title-3 text-white">삭제</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
