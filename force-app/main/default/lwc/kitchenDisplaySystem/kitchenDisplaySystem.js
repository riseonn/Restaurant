import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getOrderData from '@salesforce/apex/kitchenDisplaySystem.getOrderData';
import claimOrder from '@salesforce/apex/kitchenDisplaySystem.claimOrder';
import unclaimOrder from '@salesforce/apex/kitchenDisplaySystem.unclaimOrder';
import { refreshApex } from '@salesforce/apex';
import USER_ID from '@salesforce/user/Id';  

export default class KitchenDisplaySystem extends LightningElement {
    @api newOrders = [];
    @api inProgressOrders = [];
    @api readyOrders = [];
    @api servedOrders = [];
    errorMessage = '';
    allOrders;
    wiredOrderResult;
    searchKeyword = '';
    @track orderStates = new Map();
    currentUserId = USER_ID; // Using the USER_ID from @salesforce/user

    columns = [
        { label: 'Order #', fieldName: 'OTID__c' },
        { label: 'First Name', fieldName: 'First_Name__c' },
        { label: 'Last Name', fieldName: 'Last_Name__c' },
        { label: 'Status', fieldName: 'Status__c' },
        { label: 'Total', fieldName: 'Total__c', type: 'currency' },
        { label: 'Owner', fieldName: 'ownerName', type: 'text' },
        { label: 'Preparation Time', fieldName: 'formattedPrepTime', type: 'text' }
    ];

    @wire(getOrderData)
    wiredOrders(result) {
        this.wiredOrderResult = result;
        const { data, error } = result;

        if (data) {
            let processedData = JSON.parse(JSON.stringify(data));
            processedData = processedData.map(order => {
                const ownerName = order.Status__c === 'New' || !order.OwnerId ? '' : `${order.Owner.FirstName || ''} ${order.Owner.LastName || ''}`.trim();
                
                const prepTimeMinutes = order.Preparation_Time__r?.Time_In_Minutes__c || null;
                const formattedPrepTime = this.formatPreparationTime(prepTimeMinutes);
                
                const isClaimed = order.Status__c === 'Processing';

                return { 
                    ...order, 
                    ownerName, // Empty if the order is new or unclaimed
                    formattedPrepTime,
                    isOrderClaimed: isClaimed,
                    unclaimDisabled: !isClaimed,
                    claimDisabled: isClaimed
                };
            });

            this.allOrders = processedData;
            this.filterOrders();
        } else if (error) {
            this.errorMessage = 'Error fetching order data: ' + (error.body ? error.body.message : error.message);
            console.error('Error fetching order data: ', error);
        }
    }

    updateOrderState(orderId, isClaimed) {
        const orderToUpdate = this.allOrders.find(order => order.Id === orderId);
        if (orderToUpdate) {
            orderToUpdate.isOrderClaimed = isClaimed;
            orderToUpdate.Status__c = isClaimed ? 'Processing' : 'New';
            orderToUpdate.ownerName = `${orderToUpdate.Owner.FirstName} ${orderToUpdate.Owner.LastName}`.trim();
            orderToUpdate.unclaimDisabled = !isClaimed;
            orderToUpdate.claimDisabled = isClaimed;
        }
        this.filterOrders();
    }

    filterOrders() {
        let filteredOrders = this.allOrders || [];

        if (this.searchKeyword) {
            const lowerKeyword = this.searchKeyword.toLowerCase();
            filteredOrders = filteredOrders.filter(order => {
                return (
                    (order.OTID__c && order.OTID__c.toLowerCase().includes(lowerKeyword)) ||
                    (order.First_Name__c && order.First_Name__c.toLowerCase().includes(lowerKeyword)) ||
                    (order.Last_Name__c && order.Last_Name__c.toLowerCase().includes(lowerKeyword)) ||
                    (order.ownerName && order.ownerName.toLowerCase().includes(lowerKeyword)) ||
                    (order.Status__c && order.Status__c.toLowerCase().includes(lowerKeyword)) ||
                    (order.formattedPrepTime && order.formattedPrepTime.toLowerCase().includes(lowerKeyword))
                );
            });
        }

        // Filter based on order status
        this.newOrders = filteredOrders.filter(order => order.Status__c === 'New');
        this.inProgressOrders = filteredOrders.filter(order => order.Status__c === 'Processing');
        this.readyOrders = filteredOrders.filter(order => order.Status__c === 'Ready');
        this.servedOrders = filteredOrders.filter(order => order.Status__c === 'Served');
    }

    handleClaim(event) {
        const orderId = event.target.dataset.orderid;
        const orderToUpdate = this.allOrders.find(order => order.Id === orderId);
        
        if (!orderToUpdate) {
            this.showToast('Error', 'Order not found', 'error');
            return;
        }

        if (orderToUpdate.isOrderClaimed) {
            this.showToast('Warning', 'Order already claimed', 'warning');
            return;
        }

        this.updateOrderState(orderId, true);

        claimOrder({ orderId })
            .then(() => {
                this.showToast('Success', 'Order claimed successfully', 'success');
                return refreshApex(this.wiredOrderResult);
            })
            .catch(error => {
                this.updateOrderState(orderId, false);
                const errorMessage = error.body?.message || error.message || 'Unknown error';
                this.showToast('Error', `Failed to claim order: ${errorMessage}`, 'error');
            });
    }

    handleunclaim(event) {
        const orderId = event.target.dataset.orderid;
        const orderToUpdate = this.allOrders.find(order => order.Id === orderId);
        
        if (!orderToUpdate) {
            this.showToast('Error', 'Order not found', 'error');
            return;
        }

        if (!orderToUpdate.isOrderClaimed) {
            this.showToast('Warning', 'Order is not claimed', 'warning');
            return;
        }

        const originalState = { ...orderToUpdate };
        this.updateOrderState(orderId, false);

        unclaimOrder({ orderId })
            .then(() => {
                this.showToast('Success', 'Order unclaimed successfully', 'success');
                return refreshApex(this.wiredOrderResult);
            })
            .catch(error => {
                if (originalState) {
                    Object.assign(orderToUpdate, originalState);
                    this.filterOrders();
                }
                const errorMessage = error.body?.message || error.message || 'Unknown error occurred';
                this.showToast('Error', `Failed to unclaim order: ${errorMessage}`, 'error');
            });
    }

    handleSearchInputChange(event) {
        this.searchKeyword = event.target.value;
        this.filterOrders();
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }

    formatPreparationTime(minutes) {
        if (minutes == null) return 'Not Set';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours} hr ${mins} min`;
    }
}
