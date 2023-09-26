import type {
  NotificationQueryOptions,
  Notification,
  NotificationPaginator,
} from '@/types';
import { useInfiniteQuery, useMutation, useQuery } from 'react-query';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import client from '@/data/client';
import { useRouter } from 'next/router';

export function useNotifications(options?: NotificationQueryOptions) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery<NotificationPaginator, Error>(
    [API_ENDPOINTS.ORDERS, options],
    ({ queryKey, pageParam }) =>
      client.notifications.all(Object.assign({}, queryKey[1], pageParam)),
    {
      getNextPageParam: ({ current_page, last_page }) =>
        current_page < last_page ? { page: current_page + 1 } : undefined,
    }
  );
  function handleLoadMore() {
    // `fetchNextPage` loads the next page of data.
    fetchNextPage();
  }

  return {
    notifications: data?.pages?.flatMap((page) => page)[0].data ?? [],
    isLoading,
    error,
    hasNextPage:
      data?.pages?.flatMap((page) => page)[0].data.last_page >
        data?.pages?.flatMap((page) => page)[0].data.current_page ?? false,
    isFetching,
    isLoadingMore: isFetchingNextPage,
    loadMore: handleLoadMore,
    total: data?.pages?.flatMap((page) => page)[0].data.total ?? 0,
  };
}

// update the notification with the given id
export function useUpdateNotification() {
  return useMutation<Notification, Error, Partial<Notification>>((data) =>
    client.notifications.update(data.id)
  );
}
