import { Platform, Text, TouchableOpacity, View } from "react-native";

type ModalPosition = "center" | "bottom";
export interface ListButton {
  text: string;
  onPress: () => void | Promise<void>;
  className?: string;
}

interface ListModalProps {
  position: ModalPosition;
  buttons: ListButton[];
}

export const ListModal: React.FC<ListModalProps> = ({ position, buttons }) => {
  const containerPadding = position === "center" ? "px-[46px]" : "";
  const borderRadiusStyle =
    position === "center" ? "rounded-[10px]" : "rounded-t-[10px]";

  const bottomPadding =
    position === "bottom" ? (Platform.OS === "ios" ? "pb-[20px]" : "") : "";

  return (
    <View className={containerPadding}>
      <View
        className={`items-center bg-white ${borderRadiusStyle} ${bottomPadding}`}
      >
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
