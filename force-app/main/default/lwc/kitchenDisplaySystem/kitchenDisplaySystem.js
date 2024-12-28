import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getOrderData from '@salesforce/apex/orderManagementSystem.getOrderData';
import updateOrder from '@salesforce/apex/orderManagementSystem.updateOrder';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class OrderManagementSystem extends NavigationMixin(LightningElement) {
    newOrders = [];
    inProgressOrders = [];
    readyOrders = [];
    servedOrders = [];
    errorMessage = '';
    allOrders;
    intervalId;

    columns = [
        { label: 'Order #', fieldName: 'OTID__c' },
        { label: 'First Name', fieldName: 'First_Name__c' },
        { label: 'Last Name', fieldName: 'Last_Name__c' },
        { label: 'Mobile', fieldName: 'Mobile__c' },
        { label: 'Status', fieldName: 'Status__c' },
        { label: 'Total', fieldName: 'Total__c' }
    ];

    @wire(getOrderData)
    wiredOrderData({ error, data }) {
        if (data) {
            this.allOrders = data;
            this.newOrders = data.filter(order => order.Status__c === 'New');
            this.inProgressOrders = data.filter(order => order.Status__c === 'Processing');
            this.readyOrders = data.filter(order => order.Status__c === 'Ready');
            this.servedOrders = data.filter(order => order.Status__c === 'Served');
        } else if (error) {
            this.errorMessage = 'Error fetching order data: ' + error.body.message;
            console.error('Error fetching order data: ', error);
        }
    }

    refreshData() {
        return refreshApex(this.allOrders);
    }

    connectedCallback() {
        this.intervalId = setInterval(() => {
            this.refreshData();
        }, 30000);
    }

    disconnectedCallback() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    handleorders() {
        try {
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: '/lightning/n/Order_Management_System'
                }
            });

                    // Open the URL in a new tab using window.open
        window.open(
            '/lightning/n/Order_Management_System', 
            '_blank'  // _blank ensures the URL opens in a new tab
        );
        } catch (error) {
            console.error('Navigation error:', error);
            this.showToast('Error', 'Unable to navigate to custom URL', 'error');
        }
    }

    handlesales() {
        try {
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: '/lightning/n/Transaction_Management'
                }
            });

                    // Open the URL in a new tab using window.open
        window.open(
            '/lightning/n/Transaction_Management', 
            '_blank'  // _blank ensures the URL opens in a new tab
        );
        } catch (error) {
            console.error('Navigation error:', error);
            this.showToast('Error', 'Unable to navigate to custom URL', 'error');
        }
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }

    handleStatusChange(event) {
        const { orderId, newStatus } = event.detail;

        updateOrder({ orderId, status: newStatus })
            .then(() => {
                this.refreshData();
                this.showToast('Success', 'Order status updated successfully!', 'success');
            })
            .catch(error => {
                this.errorMessage = error.message;
                this.showToast('Error', this.errorMessage, 'error');
            });
    }
}
