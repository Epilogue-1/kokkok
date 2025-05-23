import type { ListButton, ModalPosition } from "@/types/Modal.interface";
import { Text, TouchableOpacity, View } from "react-native";

interface ListModalProps {
  position: ModalPosition;
  buttons: ListButton[];
}

export const ListModal: React.FC<ListModalProps> = ({ position, buttons }) => {
  const containerPadding = position === "center" ? "px-[46px]" : "";
  const borderRadiusStyle =
    position === "center" ? "rounded-xl" : "rounded-t-xl";

  return (
    <View className={containerPadding}>
      <View className={`items-center bg-white ${borderRadiusStyle}`}>
        {buttons.map((buttonItem, idx) => {
          const isNotLast = idx !== buttons.length - 1;
          const dividerClass = isNotLast ? "border-gray-20 border-b" : "";
          const extraClass = buttonItem.className || "";

          return (
            <TouchableOpacity
              key={buttonItem.text}
              className={`h-[82px] w-full items-center justify-center ${dividerClass} ${extraClass}`}
              onPress={async () => {
                await buttonItem.onPress();
              }}
            >
              <Text className="title-2 text-gray-90">{buttonItem.text}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
