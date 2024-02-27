import { Injectable } from "@angular/core";
import "rxjs";
import { Observable } from "rxjs";

import { Order } from "../models/order.model";
import { HttpClient } from "@angular/common/http";
import { EdukitConfig } from "../../ezukit.config";

@Injectable()
export class OrderService {
    private order: Order;
    constructor(private http: HttpClient) {}
    addOrder(order: any): Observable<Order> {
        return this.http.post<Order>(EdukitConfig.BASICS.API_URL + "/cmn/order", order);
    }
    placeOrder(user, order): Observable<Order> {
        return this.http.post<Order>(EdukitConfig.BASICS.API_URL + "/cmn/order/place-order", {
            user: user,
            order: order,
        });
    }
    getOrder(filter?: any, withHeaders?: boolean): Observable<any> {
        let opts: any = { params: filter };
        if (withHeaders) {
            opts.observe = "response";
        }
        return this.http.get(EdukitConfig.BASICS.API_URL + "/cmn/order", opts);
    }

    getOneOrder(orderId, params?: any): Observable<Order> {
        return this.http.get<Order>(EdukitConfig.BASICS.API_URL + "/cmn/order/" + orderId, { params: params });
    }

    updateOrder(orderId, order: any): Observable<Order> {
        return this.http.put<Order>(EdukitConfig.BASICS.API_URL + "/cmn/order/" + orderId, order);
    }

    deleteOrder(orderId): Observable<any> {
        return this.http.delete<any>(EdukitConfig.BASICS.API_URL + "/cmn/order/" + orderId);
    }

    getOrderProductStatusHistory(orderId, productId): Observable<Order> {
        let opts: any = { productId: productId };
        return this.http.get<Order>(EdukitConfig.BASICS.API_URL + "/cmn/order/product-status-history/" + orderId, {
            params: opts,
        });
    }
    updateOrderStatus(data: any): Observable<Order> {
        return this.http.put<Order>(EdukitConfig.BASICS.API_URL + "/cmn/order/status", data);
    }
    cancelOrder(orderId: string): Observable<Order> {
        return this.http.put<Order>(EdukitConfig.BASICS.API_URL + "/cmn/order/" + orderId + "/cancel", {});
    }
    uncancelOrder(orderId: string): Observable<Order> {
        return this.http.put<Order>(EdukitConfig.BASICS.API_URL + "/cmn/order/" + orderId + "/uncancel", {});
    }
    approvePayment(paymentId): Observable<Order> {
        return this.http.post<Order>(EdukitConfig.BASICS.API_URL + "/cmn/order/approve-payment", {
            paymentId: paymentId,
        });
    }
    approveOrder(orderId): Observable<Order> {
        return this.http.post<Order>(EdukitConfig.BASICS.API_URL + "/cmn/order/approve-order", { orderId: orderId });
    }

    reCreateReceiptPdf(paymentId): Observable<Order> {
        return this.http.post<Order>(EdukitConfig.BASICS.API_URL + "/sales/payment/recreate-receipt-pdf", {
            paymentId: paymentId,
            new: true,
        });
    }
    createReceiptPdf(paymentId): Observable<Order> {
        return this.http.post<Order>(EdukitConfig.BASICS.API_URL + "/cmn/order/create-receipt-pdf", {
            paymentId: paymentId,
            new: true,
        });
    }
    exportOrders(filter?: any, withHeaders?: boolean): Observable<any> {
        let opts: any = { params: filter };
        if (withHeaders) {
            opts.observe = "response";
        }
        return this.http.get<any>(EdukitConfig.BASICS.API_URL + "/cmn/order/export-orders", opts);
    }
    getOrderProduct(orderId: string): Observable<any> {
        return this.http.get(EdukitConfig.BASICS.API_URL + "/cmn/order/" + orderId + "/product");
    }
    removeOrderProduct(orderId, mainProductIndex, comboProductIndex): Observable<Order> {
        return this.http.post<Order>(EdukitConfig.BASICS.API_URL + "/cmn/order/remove-product", {
            orderId: orderId,
            mainProductIndex: mainProductIndex,
            comboProductIndex: comboProductIndex,
        });
    }
    changeOrderBatch(data: any): Observable<Order> {
        return this.http.put<Order>(EdukitConfig.BASICS.API_URL + "/cmn/order/change-batch", data);
    }
    getNonCouponDiscounts(): Observable<any> {
        return this.http.get(EdukitConfig.BASICS.API_URL + "/public/data/non-coupon-discounts");
    }
    processOrderFullfillStep(data: any): Observable<any> {
        return this.http.post<any>(EdukitConfig.BASICS.API_URL + "/cmn/order/process-fullfill-step", data);
    }
    addOrderDiscount(data: any): Observable<any> {
        return this.http.post<any>(EdukitConfig.BASICS.API_URL + "/cmn/order/discount", data);
    }

    importBulkStudent(data?: any): Observable<any> {
        return this.http.post<any>(EdukitConfig.BASICS.API_URL + "/student-manager/student/import-raj-student", data);
    }
    importBulkStudentAdmission(data?: any): Observable<any> {
        return this.http.post<any>(EdukitConfig.BASICS.API_URL + "/student-manager/student/import-bulk-student", data);
    }
    getTotalProcessedOrderMonthwiseCounts(): Observable<any> {
        return this.http.get(EdukitConfig.BASICS.API_URL + "/public/data/order-count-graph");
    }
    getOrderCountsByStatus(): Observable<any> {
        return this.http.get(EdukitConfig.BASICS.API_URL + "/public/data/order-count-by-status");
    }
    getOrderDiscount(orderId: string): Observable<any> {
        return this.http.get(EdukitConfig.BASICS.API_URL + "/cmn/order/" + orderId + "/discount");
    }
    updateOrderDiscount(discountId: string, body: any): Observable<any> {
        return this.http.put(EdukitConfig.BASICS.API_URL + `/cmn/order/discount/${discountId}`, body);
    }

    addCustomPmtNode(orderId: string, data: any): Observable<any> {
        return this.http.post<any>(EdukitConfig.BASICS.API_URL + "/cmn/order/" + orderId + "/custom-pmt-node", data);
    }

    importBulkOrder(data?: any): Observable<any> {
        return this.http.post<any>(EdukitConfig.BASICS.API_URL + "/student-manager/student/importbulkorder", data);
    }
    getEnquiryOrder(filter?: any): Observable<any> {
        return this.http.get<any>(EdukitConfig.BASICS.API_URL + "/cmn/order/order-by-enquiry", { params: filter });
    }
    unfullfillProduct(orderId): Observable<Order> {
        return this.http.post<Order>(EdukitConfig.BASICS.API_URL + "/cmn/order/unfullfill-order", { orderId: orderId });
    }
    getAdmissionDashBoardData(): Observable<any> {
        return this.http.get(EdukitConfig.BASICS.API_URL + "/cmn/order/get-dashboard-data-count");
    }
    enrollFreeProduct(data): Observable<any> {
        return this.http.post(EdukitConfig.BASICS.API_URL + "/cmn/enroll-to-free-product", data);
    }

    enrollMultiUserToBatch(batch, data): Observable<any> {
        return this.http.post(
            EdukitConfig.BASICS.API_URL + "/cmn/order/batch/" + batch + "/enroll-multi-user-to-batch",
            data
        );
    }

    getStudentsCountByGraph(): Observable<any> {
        return this.http.get(EdukitConfig.BASICS.API_URL + "/public/data/student/get-student-count-graph");
    }

    sendDiscountOTP(data?: any): Observable<any> {
        return this.http.post(EdukitConfig.BASICS.API_URL + "/cmn/order/discount-otp", data);
    }

    addDiscount(orderId: any, discountDetail?: any): Observable<any> {
        return this.http.post(EdukitConfig.BASICS.API_URL + "/cmn/order/" + orderId + "/add-discount", discountDetail);
    }

    importBulkStudentAdmissionWithFeeComponent(data?: any): Observable<any> {
        return this.http.post<any>(
            EdukitConfig.BASICS.API_URL + "/student-manager/student/importbulk-fee-component-order",
            data
        );
    }

    refreshStudentSRNInProcessedOrder(): Observable<any> {
        return this.http.get(EdukitConfig.BASICS.API_URL + "/cmn/order/refresh/srn");
    }

    sendPaymentReminder(orderId): Observable<any> {
        return this.http.post(EdukitConfig.BASICS.API_URL + "/sales/order/" + orderId + "/payment-reminder", {});
    }
    importBulkStudentProduct(data?: any): Observable<any> {
        return this.http.post<any>(
            EdukitConfig.BASICS.API_URL + "/student-manager/student/importbulk-with-assign-products",
            data
        );
    }

    cancelOrders(data): Observable<any> {
        return this.http.post(EdukitConfig.BASICS.API_URL + "/sales/order/cancel/orders", data);
    }
}
