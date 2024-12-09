import { LightningElement, track, wire } from 'lwc';
import createOrder from '@salesforce/apex/KitchenOrderController.createOrder'; // Import createOrder Apex method
import getAllOrders from '@salesforce/apex/KitchenOrderController.getAllOrders';
import updateOrderStatus from '@salesforce/apex/KitchenOrderController.updateOrderStatus';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class KitchenOrder extends LightningElement {
    @track orders = [];
    @track orderNumber = ''; // To hold the current order number
    @track orderStatus = 'Pending'; // Default status is Pending

    statusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' }
    ];

    columns = [
        { label: 'Order Number', fieldName: 'OrderNumber__c' },
        { label: 'Order Status', fieldName: 'OrderStatus__c' },
        { label: 'Created Date', fieldName: 'CreatedDate', type: 'date' },
        {
            type: 'action',
            typeAttributes: {
                rowActions: [
                    { label: 'Edit Status', name: 'editStatus' }
                ]
            }
        }
    ];

    // Fetch orders when the component loads
    @wire(getAllOrders)
    wiredOrders({ data, error }) {
        if (data) {
            this.orders = data;
            this.checkDateAndResetOrderNumber(); // Ensure date check runs when data is fetched
        } else if (error) {
            this.showToast('Error', error.body.message, 'error');
        }
    }

    // Lifecycle hook to ensure logic runs when the component is inserted into the DOM
    connectedCallback() {
        this.checkDateAndResetOrderNumber(); // Ensure the date check runs on page load as well
    }

    // Handle order creation
    handleOrderCreation() {
        // Before creating the order, check the date and reset the order number if necessary
        this.checkDateAndResetOrderNumber();

        if (this.orderNumber) {
            createOrder({ orderNumber: this.orderNumber, orderStatus: this.orderStatus })
                .then(result => {
                    // Add the created order to the orders list
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

    // Handle input change for order number and status
    handleInputChange(event) {
        const field = event.target.name;
        if (field === 'orderNumber') {
            this.orderNumber = event.target.value;
        } else if (field === 'orderStatus') {
            this.orderStatus = event.target.value;
        }
    }

    // Check if the date has changed and reset the order number if so
    checkDateAndResetOrderNumber() {
        const currentDate = new Date().toISOString().split('T')[0]; // Get the current date in YYYY-MM-DD format

        // Retrieve the last recorded order date from localStorage
        const lastStoredDate = localStorage.getItem('lastOrderDate');

        // If the current date is different from the stored date, reset the order number to 1
        if (lastStoredDate !== currentDate) {
            this.orderNumber = '1'; // Reset to 1
            // Store the current date in localStorage
            localStorage.setItem('lastOrderDate', currentDate);
        }
    }

    // Handle the row action (Edit Status)
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'editStatus') {
            this.editOrderStatus(row);
        }
    }

    // Edit order status
    editOrderStatus(row) {
        const updatedStatus = prompt('Enter new status:', row.OrderStatus__c);

        if (updatedStatus && this.statusOptions.some(option => option.value === updatedStatus)) {
            updateOrderStatus({ orderId: row.Id, newStatus: updatedStatus })
                .then(() => {
                    // Update the status locally to reflect changes in the UI
                    const index = this.orders.findIndex(order => order.Id === row.Id);
                    if (index !== -1) {
                        this.orders[index].OrderStatus__c = updatedStatus;
                    }
                    this.showToast('Success', 'Order status updated successfully!', 'success');
                })
                .catch(error => {
                    this.showToast('Error', error.body.message, 'error');
                });
        } else {
            this.showToast('Error', 'Invalid status selected.', 'error');
        }
    }
}
