import { LightningElement, track, wire } from 'lwc';
import getAllOrders from '@salesforce/apex/KitchenOrderController.getAllOrders';
import createOrder from '@salesforce/apex/KitchenOrderController.createOrder';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class KitchenOrder extends LightningElement {
    @track orders = [];
    @track orderNumber = '';
    @track orderStatus = 'Pending'; // Default status is Pending
    statusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' }
    ];

    columns = [
        { label: 'Order Number', fieldName: 'OrderNumber__c' },
        { label: 'Order Status', fieldName: 'OrderStatus__c' },
        { label: 'Created Date', fieldName: 'CreatedDate', type: 'date' }
    ];

    // Fetch orders when the component loads
    @wire(getAllOrders)
    wiredOrders({ data, error }) {
        if (data) {
            this.orders = data;
        } else if (error) {
            this.showToast('Error', error.body.message, 'error');
        }
    }

    // Handle order creation
    handleOrderCreation() {
        if (this.orderNumber) {
            createOrder({ orderNumber: this.orderNumber, orderStatus: this.orderStatus })
                .then(result => {
                    this.orders = [result, ...this.orders];
                    this.showToast('Success', 'Order created successfully!', 'success');
                    this.orderNumber = ''; // Clear input after creation
                })
                .catch(error => {
                    this.showToast('Error', error.body.message, 'error');
                });
        } else {
            this.showToast('Error', 'Order number cannot be empty!', 'error');
        }
    }

    // Show toast notification
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }

    // Handle input change
    handleInputChange(event) {
        const field = event.target.name;
        if (field === 'orderNumber') {
            this.orderNumber = event.target.value;
        } else if (field === 'orderStatus') {
            this.orderStatus = event.target.value;
        }
    }
}
