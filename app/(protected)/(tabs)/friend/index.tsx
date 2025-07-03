import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import ErrorScreen from "@/components/ErrorScreen";
import { FriendItem } from "@/components/FriendItem";
import LoadingScreen from "@/components/LoadingScreen";
import { SearchLayout } from "@/components/SearchLayout";
import useInfiniteLoad from "@/hooks/useInfiniteLoad";
import { debounce } from "@/utils/DelayManager";
import { getFriends, subscribeFriendsStatus, supabase } from "@/utils/supabase";
import { useFocusEffect } from "expo-router";

const LIMIT = 12;

export default function Friend() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");

  // 유저의 친구 정보 조회
  const {
    data: friendData,
    isLoading,
    isFetchingNextPage,
    error,
    loadMore,
    refetch,
  } = useInfiniteLoad({
    queryFn: getFriends(keyword),
    queryKey: ["friends", keyword],
    limit: LIMIT,
  });
  const friends = friendData?.pages.flatMap((page) => page.data) || [];

  const handleKeywordChange = debounce((newKeyword: string) => {
    setKeyword(newKeyword);
  }, 200);

  // 친구창에 focus 들어올 때마다 친구목록 새로고침 (검색중일 때 제외)
  useFocusEffect(
    useCallback(() => {
      if (!keyword && !isFetchingNextPage) {
        queryClient.invalidateQueries({ queryKey: ["friends"] });
      }
    }, [queryClient, keyword, isFetchingNextPage]),
  );

  // 친구의 운동 정보가 바뀌면 쿼리 다시 패치하도록 정보 구독
  useEffect(() => {
    const friendIds = friends?.map(({ id }) => id);

    const statusChannel = subscribeFriendsStatus(friendIds, () =>
      queryClient.invalidateQueries({ queryKey: ["friends"] }),
    );

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [friends, queryClient.invalidateQueries]);

  // 에러 스크린
  if (error) {
    return (
      <SearchLayout
        data={[]}
        onChangeKeyword={handleKeywordChange}
        renderItem={() => <></>}
        emptyComponent={<ErrorScreen errorMessage={error.message} />}
      />
    );
  }

  // 로딩 스크린
  if (isLoading) {
    return (
      <SearchLayout
        data={[]}
        onChangeKeyword={handleKeywordChange}
        renderItem={() => <></>}
        emptyComponent={<LoadingScreen />}
      />
    );
  }

  return (
    <SearchLayout
      refetch={refetch}
      data={friends}
      onChangeKeyword={handleKeywordChange}
      loadMore={loadMore}
      isFetchingNextPage={isFetchingNextPage}
      renderItem={({ item: friend }) => <FriendItem friend={friend} />}
      emptyComponent={
        <ErrorScreen
          errorMessage={
            keyword ? "친구를 찾지 못했어요" : "아직 친구가 없습니다."
          }
        />
      }
    />
  );
}
