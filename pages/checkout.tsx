import { PaymentGateway, type NextPageWithLayout } from '@/types';
import { useRouter } from 'next/router';
import routes from '@/config/routes';
import GeneralLayout from '@/layouts/_general-layout';
import CartItemList from '@/components/cart/cart-item-list';
import CartEmpty from '@/components/cart/cart-empty';
import Button from '@/components/ui/button';
import PhoneInput, { usePhoneInput } from '@/components/ui/forms/phone-input';
import { useCart } from '@/components/cart/lib/cart.context';
import usePrice, { formatVariantPrice } from '@/lib/hooks/use-price';
import Seo from '@/layouts/_seo';
import { LongArrowIcon } from '@/components/icons/long-arrow-icon';
import client from '@/data/client';
import { useMutation } from 'react-query';
import CartCheckout from '@/components/cart/cart-checkout';
import { useMe } from '@/data/user';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps } from 'next';
import CartCheckoutItemList from '@/components/cart/cart-checkout-item-list';
import { useEffect, useMemo, useState } from 'react';
import {
  calculatePaidTotal,
  calculateTotal,
} from '@/components/cart/lib/cart.utils';
import { useAtom } from 'jotai';
import {
  checkoutAtom,
  useWalletPointsAtom,
  verifiedTokenAtom,
} from '@/components/cart/lib/checkout';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSettings } from '@/data/settings';
import { getMessaging, onMessage } from '@firebase/messaging';
import app from '@/data/utils/firebase';
import toast from 'react-hot-toast';
import { InformationIcon } from '@/components/icons/information-icon';

const CheckoutPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { me } = useMe();
  const { t } = useTranslation('common');
  const {
    items,
    total,
    totalItems,
    isEmpty,
    setVerifiedResponse,
    verifiedResponse,
    resetCart,
  } = useCart();
  const { price: totalPrice } = usePrice({
    amount: total,
  });
  const [startDate, setStartDate] = useState(
    new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
  );
  const tax = localStorage.getItem('tax');
  const [totalAmount, setTotalAmount] = useState(total);
  const [finalTotal, setFinalTotal] = useState(total + (total * tax) / 100);
  const [discount, setDiscount] = useState(0);

  const base_amount = calculateTotal(items);
  const { mutate, isLoading } = useMutation(client.orders.create, {
    onSuccess: (res) => {
      // setVerifiedResponse(res);
    },
  });
  const { mutate: verifyOrder, isLoading: isVerifying } = useMutation(
    client.orders.checkAvailability,
    {
      onSuccess: (res) => {
        // go to purchase page
        router.push(routes.purchases);
      },
    }
  );
  const [use_wallet_points] = useAtom(useWalletPointsAtom);
  const [{ payment_gateway }] = useAtom(checkoutAtom);
  const [token] = useAtom(verifiedTokenAtom);
  const { phoneNumber } = usePhoneInput();
  const [diffDay, setDiffDays] = useState(1);
  const { settings } = useSettings();

  const calculateDiscount = (item: any) => {
    let itemPrice = item.price * item.quantity * diffDay;

    if (
      diffDay >= 7 &&
      diffDay < 30 &&
      item.one_week_discount &&
      item.one_months_discount &&
      item.three_days_discount
    ) {
      return (itemPrice * item?.one_week_discount ?? 0) / 100;
    } else if (diffDay >= 30) {
      return (itemPrice * item?.one_months_discount ?? 0) / 100;
    } else if (diffDay >= 3 && diffDay < 7) {
      return (itemPrice * item?.three_days_discount ?? 0) / 100;
    }
  };

  function verify() {
    resetCart();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    mutate({
      amount: totalAmount,
      total: totalAmount,
      paid_total: finalTotal,
      discount: discount,
      sales_tax: (totalAmount * tax) / 100,
      products: items.map((item) => ({
        product_id: item.id,
        order_quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity * diffDays,
        discount: calculateDiscount(item),
        from: startDate.toISOString().substring(0, 10),
        to: endDate.toISOString().substring(0, 10),
      })),
      payment_gateway: use_wallet_points
        ? PaymentGateway.FULL_WALLET_PAYMENT
        : payment_gateway,
      use_wallet_points,
      ...(token && { token }),
      customer_contact: phoneNumber ? phoneNumber : '1',
    });
    // check availability api call
    // convert start and end date to iso string

    verifyOrder({
      products_ids: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        from: startDate.toISOString().substring(0, 10),
        to: endDate.toISOString().substring(0, 10),
      })),
    });
  }

  const formatTotal = (total: string) => {
    // if total is not a number thern convert it to number
    const totalAmount = Number(total);
    return totalAmount?.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const onChange = (dates: any[]) => {
    const [start, end] = dates;
    if (end) {
      setStartDate(start);
      setEndDate(end);
      // get difference in days
      const startDates = new Date(start);
      const endDates = new Date(end);
      const diffTime = Math.abs(endDates.getTime() - startDates.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDiffDays(diffDays);
      let totalAmount: any = total * diffDays;
      // use usePrice hook to format the totalAmount
      let totalDiscountAmount = 0;
      let discountPrice = 0;
      let dis = 0;
      let disc = 0;
      items.forEach((item) => {
        let itemPrice = item.price * item.quantity * diffDays;
        totalDiscountAmount += itemPrice;
        if (diffDays >= 7 && diffDays < 30) {
          discountPrice = (itemPrice * item?.one_week_discount ?? 0) / 100;
          dis = (itemPrice * item?.one_week_discount ?? 0) / 100;
        } else if (diffDays >= 30) {
          discountPrice = (itemPrice * item?.one_months_discount ?? 0) / 100;
          dis = (itemPrice * item?.one_months_discount ?? 0) / 100;
        } else if (diffDays >= 3 && diffDays < 7) {
          discountPrice = (itemPrice * item?.three_days_discount ?? 0) / 100;
          dis = (itemPrice * item?.three_days_discount ?? 0) / 100;
        }
        // discount price with tax
        totalDiscountAmount -= discountPrice;
        // total dis amount when loop ends
        disc += dis;
      });

      // totalAmount = totalAmount - discount in percentage
      if (totalDiscountAmount > 0) {
        totalDiscountAmount = totalDiscountAmount + (totalAmount * tax) / 100;
      } else {
        totalDiscountAmount = totalAmount + (totalAmount * tax) / 100;
      }

      setDiscount(disc);
      setFinalTotal(totalDiscountAmount);
      setTotalAmount(totalAmount);
    } else {
      // gives error when end date is not selected
      toast.error('Please select end date');
      setStartDate(start);
      setEndDate(end);
      // get difference in days
      const startDates = new Date(start);
      const endDates = new Date(start);
      const diffTime = Math.abs(endDates.getTime() - startDates.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDiffDays(diffDays);
      let totalAmount: any = total * diffDays;
      setTotalAmount(totalAmount);
    }
  };

  useEffect(() => {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      // ...
    });
    const startDates = new Date(startDate);
    const endDates = new Date(endDate);
    const diffTime = Math.abs(endDates.getTime() - startDates.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    setDiffDays(diffDays);
    let totalAmount: any = total * diffDays;
    // use usePrice hook to format the totalAmount
    let totalDiscountAmount = 0;
    let discountPrice = 0;
    let dis = 0;
    let disc = 0;
    items.forEach((item) => {
      let itemPrice = item.price * item.quantity * diffDays;
      if (diffDays >= 7 && diffDays < 30) {
        discountPrice =
          itemPrice - (itemPrice * item?.one_week_discount ?? 0) / 100;
        dis = (itemPrice * item?.one_week_discount ?? 0) / 100;
      } else if (diffDays >= 30) {
        discountPrice =
          itemPrice - (itemPrice * item?.one_months_discount ?? 0) / 100;
        dis = (itemPrice * item?.one_months_discount ?? 0) / 100;
      } else if (diffDays >= 3 && diffDays < 7) {
        discountPrice =
          itemPrice - (itemPrice * item?.three_days_discount ?? 0) / 100;
        dis = (itemPrice * item?.three_days_discount ?? 0) / 100;
      }
      // discount price with tax
      totalDiscountAmount += discountPrice;
      // total dis amount when loop ends
      disc += dis;
    });
    // totalAmount = totalAmount - discount in percentage
    totalDiscountAmount = totalAmount + (totalAmount * tax) / 100;
    setDiscount(disc);
    setFinalTotal(totalDiscountAmount);
    setTotalAmount(totalAmount);

    if (isEmpty) {
      router.push(routes.home);
    }
  }, [items]);

  return (
    <>
      <Seo
        title="Checkout"
        description="Fastest digital download template built with React, NextJS, TypeScript, React-Query and Tailwind CSS."
        url={routes?.checkout}
      />
      <div className="mx-auto flex h-full w-full max-w-screen-sm flex-col p-4 pt-6 sm:p-5 sm:pt-8 md:pt-10 3xl:pt-12">
        {!isEmpty && Boolean(verifiedResponse) ? (
          <div className="mb-4 bg-light shadow-card dark:bg-dark-250 dark:shadow-none md:mb-5 3xl:mb-6">
            <h2 className="flex items-center justify-between border-b border-light-400 px-5 py-4 text-sm font-medium text-dark dark:border-dark-400 dark:text-light sm:py-5 sm:px-7 md:text-base">
              {t('text-checkout-title')}
            </h2>
            <div className="px-5 py-4 sm:py-6 sm:px-7">
              <PhoneInput defaultValue={me?.profile?.contact} />
            </div>
          </div>
        ) : null}

        <div className="bg-light shadow-card dark:bg-dark-250 dark:shadow-none">
          <h2 className="flex items-center justify-between border-b border-light-400 px-5 py-4 text-sm font-medium text-dark dark:border-dark-400 dark:text-light sm:py-5 sm:px-7 md:text-base">
            {t('text-checkout-title-two')}
            <span className="font-normal text-dark-700">({totalItems})</span>
          </h2>

          <div className="px-5 pt-9 sm:px-7 sm:pt-11">
            {!isEmpty ? (
              <CartCheckoutItemList className="pl-3" />
            ) : (
              <>
                <CartEmpty />
                <div className="sticky bottom-11 z-[5] mt-10 border-t border-light-400 bg-light pt-6 pb-7 dark:border-dark-400 dark:bg-dark-250 sm:bottom-0 sm:mt-12 sm:pt-8 sm:pb-9">
                  <Button
                    onClick={() => router.push(routes.home)}
                    className="w-full md:h-[50px] md:text-sm"
                  >
                    <LongArrowIcon className="h-4 w-4" />
                    {t('404-back-home')}
                  </Button>
                </div>
              </>
            )}
            <div className="sticky bottom-11 z-[5] mt-10 border-t border-light-400 bg-light pt-6 pb-7 dark:border-dark-400 dark:bg-dark-250 sm:bottom-0 sm:mt-12 sm:pt-8 sm:pb-9">
              <div className="mb-6 flex flex-col gap-3 text-dark dark:text-light sm:mb-7">
                <div className="flex">
                  <span className="w-56">
                    <p style={{ paddingTop: '10px' }}>Select Date</p>
                  </span>
                  <ReactDatePicker
                    selected={startDate}
                    onChange={onChange}
                    startDate={startDate}
                    endDate={endDate}
                    monthsShown={2}
                    className="ml-10 bg-transparent pl-10"
                    // disable past dates and current date
                    minDate={
                      new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
                    }
                    // excludeDates={[addDays(new Date(), 1), addDays(new Date(), 5)]}
                    selectsRange
                    // selectsDisabledDaysInRanges
                    // inline
                  />
                </div>
                {/* display as a note */}
                <div className="flex justify-end">
                  <InformationIcon className="h-4 w-4" />
                  <p
                    className="font-sm px-2 text-neutral-200"
                    style={{
                      textAlign: 'right',
                      fontSize: 'smaller',
                      color: 'gray',
                    }}
                  >
                    {settings?.dayOfCollection}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p>{t('text-subtotal')}</p>
                  <strong className="font-semibold">
                    {formatTotal(totalAmount)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <p>{t('text-number-of-days')}</p>
                  <strong className="font-semibold">{diffDay}</strong>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between">
                    <p>{t('text-discount')}</p>
                    <strong className="font-semibold">
                      {formatTotal(discount.toString())}
                    </strong>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <p>{t('text-tax')}</p>
                  <strong className="font-semibold">
                    {formatTotal(((totalAmount * tax) / 100).toString())}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <p>{t('text-total')}</p>
                  <strong className="font-semibold">
                    {formatTotal(finalTotal)}
                  </strong>
                </div>
              </div>
              <Button
                className="w-full md:h-[50px] md:text-sm"
                onClick={verify}
                isLoading={isLoading}
              >
                {t('text-check-availability')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

CheckoutPage.authorization = true;
CheckoutPage.getLayout = function getLayout(page) {
  return <GeneralLayout>{page}</GeneralLayout>;
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
    },
    revalidate: 60, // In seconds
  };
};

export default CheckoutPage;
