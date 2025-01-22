import colors from "@/constants/colors";
import type { UserProfile } from "@/types/User.interface";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  type ListRenderItemInfo,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchBar from "./SearchBar";

interface SearchLayoutProps {
  refetch?: () => void;
  data: UserProfile[]; // 추후 검색 사용 범위 넓어지면 변경 가능
  isFetchingNextPage?: boolean;
  onChangeKeyword: (newKeyword: string) => void;
  loadMore?: () => void;
  renderItem: (itemInfo: ListRenderItemInfo<UserProfile>) => React.ReactElement;
  emptyComponent: React.ReactElement;
}

export function SearchLayout<T>({
  refetch,
  data,
  isFetchingNextPage,
  onChangeKeyword,
  loadMore,
  renderItem,
  emptyComponent,
}: SearchLayoutProps) {
  const [keyword, setKeyword] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const handleScrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    refetch?.();
  }, [refetch]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "SCROLL_FRIEND_TO_TOP",
      handleScrollToTop,
    );

    return () => subscription.remove();
  }, [handleScrollToTop]);

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-white">
      <FlatList
        ref={flatListRef}
        className="w-full grow px-6"
        data={data}
        keyExtractor={(elem) => elem.id}
        renderItem={renderItem}
        onEndReached={loadMore}
        contentContainerStyle={data.length ? {} : { flex: 1 }}
        ListHeaderComponent={
          <SearchBar
            value={keyword}
            customClassName="mt-6 mb-2"
            handleChangeText={(newKeyword: string) => {
              setKeyword(newKeyword);
              onChangeKeyword(newKeyword);
            }}
          />
        }
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              size="large"
              className="py-4"
              color={colors.primary}
            />
          ) : (
            <View className="h-4" />
          )
        }
      />
    </SafeAreaView>
  );
}
