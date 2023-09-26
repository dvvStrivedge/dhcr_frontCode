import { PaymentStatus } from '@/types';

// export const ORDER_STATUS = [
//   { name: 'Order Pending', status: 'order-pending', serial: 1 },
//   { name: 'Order Processing', status: 'order-processing', serial: 2 },
//   {
//     name: 'Order At Local Facility',
//     status: 'order-at-local-facility',
//     serial: 3,
//   },
//   {
//     name: 'Order Out For Delivery',
//     status: 'order-out-for-delivery',
//     serial: 4,
//   },
//   { name: 'Order Completed', status: 'order-completed', serial: 5 },
//   { name: 'Order Cancelled', status: 'order-cancelled', serial: 5 },
//   { name: 'Order Refunded', status: 'order-refunded', serial: 5 },
//   { name: 'Order Failed', status: 'order-failed', serial: 5 },
// ];

export const ORDER_STATUS = [
  { name: 'Checking Availibility', status: 'waiting-for-approval', serial: 1 },
  {
    name: 'Available, Waiting for payment',
    status: 'approved-order',
    serial: 2,
  },
  { name: 'Order Cancelled', status: 'order-cancelled', serial: 3 },
  { name: 'Rental Confirmed', status: 'paid-and-confirmed', serial: 4 },
  { name: 'In Process', status: 'in-process', serial: 5 },
  { name: 'Done', status: 'done', serial: 6 },
];

export const filterOrderStatus = (
  orderStatus: any[],
  paymentStatus: PaymentStatus,
  currentStatusIndex: number,
  currentOrderStatus: any
) => {
  if (currentOrderStatus === 'order-cancelled') {
    return orderStatus.slice(0, 3);
  }
  if (currentOrderStatus !== 'order-cancelled') {
    orderStatus = orderStatus.filter(
      (status) => status.status !== 'order-cancelled'
    );
    if (PaymentStatus.SUCCESS.includes(paymentStatus)) {
      return currentStatusIndex > 5
        ? [...orderStatus.slice(0, 4), orderStatus[currentStatusIndex]]
        : orderStatus.slice(0, 5);
    }
    return currentStatusIndex > 5
      ? [...orderStatus.slice(0, 2), orderStatus[currentStatusIndex]]
      : orderStatus.slice(0, 6);
  }
};
