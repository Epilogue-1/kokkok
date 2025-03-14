import { TextInput, View } from "react-native";

import icons from "@/constants/icons";

interface SearchBarProps {
  value: string;
  customClassName?: string;
  handleChangeText: (k: string) => void;
}

export default function SearchBar({
  value,
  customClassName,
  handleChangeText,
}: SearchBarProps) {
  return (
    <View
      className={`w-full h-[54px] rounded-[10px] bg-gray-10 flex-row ${customClassName ? customClassName : ""}`}
    >
      <icons.SearchIcon
        width={24}
        height={24}
        style={{ margin: 16 }}
        accessibilityRole="image"
        accessibilityLabel="검색 아이콘"
      />
      <TextInput
        value={value}
        onChangeText={(e) => handleChangeText(e)}
        // onSubmitEditing={() => {}} todo
        returnKeyType="search"
        placeholder="닉네임을 입력해주세요"
        className="pt-[3px] body-1 w-full placeholder:text-gray-60 text-gray-100 p-0"
        accessibilityRole="search"
        accessibilityLabel="친구 검색"
        accessibilityHint="친구를 검색하려면 이름을 입력하세요"
      />
    </View>
  );
}
