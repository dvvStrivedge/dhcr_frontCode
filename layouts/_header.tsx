import type { User } from '@/types';
import { Fragment, use, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Avatar from 'react-avatar';
import routes from '@/config/routes';
import Logo from '@/components/ui/logo';
import ThemeSwitcher from '@/components/ui/theme-switcher';
import ActiveLink from '@/components/ui/links/active-link';
import { useLogout, useMe } from '@/data/user';
import { Menu } from '@/components/ui/dropdown';
import { Transition } from '@/components/ui/transition';
import { UserIcon } from '@/components/icons/user-icon';
import SearchButton from '@/components/search/search-button';
import CartButton from '@/components/cart/cart-button';
import Hamburger from '@/components/ui/hamburger';
import GridSwitcher from '@/components/product/grid-switcher';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import { useSwapBodyClassOnScrollDirection } from '@/lib/hooks/use-swap-body-class';
import { useModalAction } from '@/components/modal-views/context';
import Button from '@/components/ui/button';
import LanguageSwitcher from '@/components/ui/language-switcher';
import { useTranslation } from 'next-i18next';
import { useMutation } from 'react-query';
import client from '@/data/client';
import { NotifaiIcon } from '@/components/icons/notifai-icon';

const AuthorizedMenuItems = [
  {
    label: 'text-auth-profile',
    path: routes.profile,
  },
  {
    label: 'text-auth-purchase',
    path: routes.purchases,
  },
  {
    label: 'text-auth-wishlist',
    path: routes.wishlists,
  },
  // {
  //   label: 'text-followed-authors',
  //   path: routes.followedShop,
  // },
  {
    label: 'text-auth-notifications',
    path: routes.notifications,
  },
  {
    label: 'text-auth-password',
    path: routes.password,
  },
];

function AuthorizedMenu({
  user,
  unReadCount,
}: {
  user: User;
  unReadCount: number;
}) {
  const { mutate: logout } = useLogout();
  const { t } = useTranslation('common');
  return (
    <Menu>
      <Menu.Button className="relative inline-flex h-8 w-8 justify-center rounded-full border border-light-400 bg-light-300 dark:border-dark-500 dark:bg-dark-500">
        {/* @ts-ignore */}
        <Avatar
          size="32"
          round={true}
          name={user.name}
          textSizeRatio={2}
          src={user?.profile?.avatar?.thumbnail}
        />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute top-[84%] z-30 mt-4 w-56 rounded-md bg-light py-1.5 text-dark shadow-dropdown ltr:right-0 ltr:origin-top-right rtl:left-0 rtl:origin-top-left dark:bg-dark-250 dark:text-light">
          {AuthorizedMenuItems.map((item) => (
            <Menu.Item key={item.label}>
              <ActiveLink
                href={item.path}
                className="transition-fill-colors flex w-full items-center px-5 py-2.5 hover:bg-light-400 dark:hover:bg-dark-600"
              >
                {item.label === 'text-auth-notifications'
                  ? t(item.label) + ' (' + (unReadCount ? unReadCount : 0) + ')'
                  : t(item.label)}
              </ActiveLink>
            </Menu.Item>
          ))}
          <Menu.Item>
            <button
              type="button"
              className="transition-fill-colors w-full px-5 py-2.5 hover:bg-light-400 ltr:text-left rtl:text-right dark:hover:bg-dark-600"
              onClick={() => logout()}
            >
              {t('text-logout')}
            </button>
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function LoginMenu({ unReadCount }: { unReadCount: number }) {
  const { openModal } = useModalAction();
  const { me, isAuthorized, isLoading } = useMe();
  const isMounted = useIsMounted();
  if (!isMounted) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-light-300 dark:bg-dark-500" />
    );
  }
  if (isAuthorized && me && !isLoading) {
    return (
      <>
        <AuthorizedMenu user={me} unReadCount={unReadCount} />
        {unReadCount > 0 ? (
          <span className="absolute -top-3 -right-2.5 flex min-h-[20px] min-w-[20px] shrink-0 items-center justify-center rounded-full border-2 border-light-100 bg-brand px-0.5 text-10px font-bold leading-none text-light dark:border-dark-250">
            {}
          </span>
        ) : (
          ''
        )}
      </>
    );
  }
  return (
    <Button
      variant="icon"
      aria-label="User"
      className="flex"
      onClick={() => openModal('LOGIN_VIEW')}
    >
      <UserIcon className="h-5 w-5" />
    </Button>
  );
}

interface HeaderProps {
  isCollapse?: boolean;
  showHamburger?: boolean;
  onClickHamburger?: () => void;
}

export default function Header({
  isCollapse,
  showHamburger = false,
  onClickHamburger,
}: HeaderProps) {
  const { asPath } = useRouter();
  const { t } = useTranslation('common');
  useSwapBodyClassOnScrollDirection();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any>([]);
  const { mutate: getNotifications } = useMutation(client.notifications.all, {
    onSuccess: (data: any) => {
      setNotifications(data);
    },
  });
  const { me, isAuthorized } = useMe();

  // useupdate notification
  const { mutate: updateNotification } = useMutation(
    client.notifications.update,
    {
      onSuccess: (data: any) => {
        getNotifications({
          limit: 5,
        });
      },
    }
  );

  const isMultiLangEnable =
    process.env.NEXT_PUBLIC_ENABLE_MULTI_LANG === 'true' &&
    !!process.env.NEXT_PUBLIC_AVAILABLE_LANGUAGES;

  // // get notification list
  // const { notifications: notifications } = useNotifications({
  //   limit: 5,
  //   is_read: false,
  // });

  // get notification list
  useEffect(() => {
    isAuthorized &&
      getNotifications({
        limit: 5,
      });
    // get notification api call every 10 seconds
    // const interval = setInterval(() => {
    //   getNotifications({
    //     limit: 5,
    //   });
    // }, 10000);
    // return () => clearInterval(interval);
  }, [notifications]);

  const convertDate = (date: string) => {
    // convert date to days ago, hours ago, minutes ago format
    const currentDate = new Date();
    const previousDate = new Date(date);
    const diff = currentDate.getTime() - previousDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) {
      return `${days} days ago`;
    } else if (hours > 0) {
      return `${hours} hours ago`;
    } else if (minutes > 0) {
      return `${minutes} minutes ago`;
    } else {
      return 'Just now';
    }
  };

  const onNotificationClick = (notification: any) => {
    // mark notification as read
    updateNotification({ id: notification?.id });

    // redirect to notification details page
    router.push(
      `${routes.orderUrl(
        notification?.order?.tracking_number
      )}/payment/?order=${notification?.order?.tracking_number}`
    );
  };

  // const openNotifications = () => {
  //   getNotifications({
  //     limit: 5,
  //     is_read: false,
  //   });
  // };

  return (
    <header className="app-header sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-light-300 bg-light py-1 px-4 ltr:left-0 rtl:right-0 dark:border-dark-300 dark:bg-dark-250 sm:h-[70px] sm:px-6">
      <div className="flex items-center gap-4">
        {/* {showHamburger && (
          <Hamburger
            isToggle={isCollapse}
            onClick={onClickHamburger}
            className="hidden sm:flex"
          />
        )} */}
        <Logo />
      </div>
      <nav className="hidden items-center gap-8 px-3 sm:flex">
        <ActiveLink
          href={routes.info}
          activeClassName="text-brand"
          className="text-heading font-semibold"
        >
          {t('text-info')}
        </ActiveLink>
        <ActiveLink
          href={routes.about}
          activeClassName="text-brand"
          className="text-heading font-semibold"
        >
          {t('text-aboutus')}
        </ActiveLink>
        <ActiveLink
          href={routes.contact}
          activeClassName="text-brand"
          className="text-heading font-semibold"
        >
          {t('text-contactus')}
        </ActiveLink>
      </nav>
      <div className="relative flex items-center gap-5 pr-0.5 xs:gap-6 sm:gap-7">
        <SearchButton className="hidden sm:flex" />
        <ThemeSwitcher />
        {/* <GridSwitcher /> */}
        {asPath !== routes.checkout && (
          <CartButton className="hidden sm:flex" />
        )}
        {isMultiLangEnable ? (
          <div className="ltr:ml-auto rtl:mr-auto">
            <LanguageSwitcher />
          </div>
        ) : (
          ''
        )}
        {/* {isAuthorized ?
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="flex items-center focus:outline-none">
              <span className="relative flex items-center">
                <NotifaiIcon className="h-5 w-5" />
                <span className="absolute -top-3 -right-2.5 flex min-h-[20px] min-w-[20px] shrink-0 items-center justify-center rounded-full border-2 border-light-100 bg-brand px-0.5 text-10px font-bold leading-none text-light dark:border-dark-250">
                  {notifications?.un_read_count}
                </span>
              </span>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                as="ul"
                className="end-0 origin-top-end notification absolute mt-1 w-56 rounded bg-light shadow-2xl focus:outline-none"
                style={{
                  right: '-50px',
                  width: '480px',
                  overflowY: 'auto',
                  height: '480px',
                }}
              >
                {notifications?.data?.data?.length ? (
                  <>
                    {notifications?.data?.data?.map((notification: any) => (
                      <>
                        <Menu.Item key={notification?.id}>
                          <div
                            className={`transition-fill-colors d-flex border-bottom mb-1 flex-row ${notification?.is_read ? 'unread' : 'read'
                              }`}
                            key={notification?.id}
                            onClick={() => onNotificationClick(notification)}
                          >
                            <div
                              className="mb-2 flex items-center pt-2 pl-3 pr-2"
                              style={{ cursor: 'pointer', padding: '5px' }}
                            >
                              <span
                                className="flex items-center justify-center"
                                style={{
                                  borderRadius: '50px',
                                  // border: '1px solid #ccc',
                                  width: '40px',
                                  height: '40px',
                                  minWidth: '40px',
                                  minHeight: '40px',
                                }}
                              >
                                <Avatar
                                  size="32"
                                  round={true}
                                  name={me?.name}
                                  textSizeRatio={2}
                                  src={me?.profile?.avatar?.thumbnail}
                                />
                              </span>

                              <span
                                className="font-weight-medium notification-heading mb-1 grow pl-2"
                                style={{ fontSize: '16px' }}
                                onClick={() => onNotificationClick(notification)}
                              >
                                <b>{notification?.title}</b>
                              </span>
                              {!notification?.is_read ? (
                                <span className="hightlight"></span>
                              ) : (
                                ''
                              )}
                            </div>
                            <div
                              className="pl-3 pr-2"
                              style={{
                                borderBottom: '1px solid #252525',
                                paddingLeft: '50px',
                              }}
                            >
                              <div style={{ cursor: 'pointer' }}>
                                {/* <p className="font-weight-medium mb-1">test 1</p> */}
        {/* <p
          className="text-muted text-small notification-text1 mb-1"
          style={{
            fontSize: '13px',
            lineHeight: 'normal',
          }}
        >
          {notification?.description}
        </p>
        <p
          className="text-muted text-small mb-3 mb-3"
          style={{
            fontSize: '10px',
            lineHeight: 'normal',
            marginBottom: '15px',
          }}
        >
          {convertDate(notification?.created_at)}
        </p>
      </div>
    </div>
                          </div >
                        </Menu.Item >
                      </>
                    ))
}
<Menu.Item key="1"> */}
        {/* show all notification button  */}
        {/* <div className="d-flex justify-content-between flex-row">
    <div className="pl-3 pr-2">
      <div style={{ cursor: 'pointer' }}>
        <p
          className="text-muted text-small mb-3 mt-3 text-center"
          style={{
            fontSize: '10px',
            lineHeight: 'normal',
            marginBottom: '15px',
          }}
          onClick={() => router.push(routes.notifications)}
        >
          Show all notifications
        </p>
      </div>
    </div>
  </div>
</Menu.Item>
                  </>
                ) : (
  <Menu.Item key="1"> */}
        {/* show all notification button  */}
        {/* <div className="d-flex justify-content-between flex-row">
      <div className="pl-3 pr-2">
        <div style={{ cursor: 'pointer' }}>
          <p
            className="text-muted text-small mb-3 mt-3 text-center"
            style={{
              fontSize: '16px',
              lineHeight: 'normal',
              marginBottom: '15px',
            }}
          >
            No notification found
          </p>
        </div>
      </div>
    </div>
  </Menu.Item>
)}
              </Menu.Items >
            </Transition >
          </Menu >
          : ''}  */}
        {/* <a
          href={`${process.env.NEXT_PUBLIC_ADMIN_URL}/register`}
          target="_blank"
          rel="noreferrer"
          className="focus:ring-accent-700 hidden h-9 shrink-0 items-center justify-center rounded border border-transparent bg-brand px-3 py-0 text-sm font-semibold leading-none text-light outline-none transition duration-300 ease-in-out hover:bg-brand-dark focus:shadow focus:outline-none focus:ring-1 sm:inline-flex"
        >
          {t('text-become-seller')}
        </a> */}
        <LoginMenu unReadCount={notifications?.un_read_count} />
      </div>
    </header>
  );
}
