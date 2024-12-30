import { LightningElement, wire, api } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getOrderData from '@salesforce/apex/kitchenDisplaySystem.getOrderData';
import getPreparationTimes from '@salesforce/apex/kitchenDisplaySystem.getPreparationTimes';
import updateOrderPrepTime from '@salesforce/apex/kitchenDisplaySystem.updateOrderPrepTime';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class KitchenDisplaySystem extends LightningElement {
    @api newOrders = [];
    @api inProgressOrders = [];
    @api readyOrders = [];
    @api servedOrders = [];
    errorMessage = '';
    allOrders;
    intervalId;
    autoStatusUpdateInterval = 60000; 

    searchChefName = ''; 
    searchKeyword = ''; // New property for general search term

    columns = [
        { label: 'Order #', fieldName: 'OTID__c' },
        { label: 'First Name', fieldName: 'First_Name__c' },
        { label: 'Last Name', fieldName: 'Last_Name__c' },
        { label: 'Mobile', fieldName: 'Mobile__c' },
        { label: 'Status', fieldName: 'Status__c' },
        { label: 'Total', fieldName: 'Total__c' },
        { 
            label: 'Chef', 
            fieldName: 'chefName', 
            type: 'text'
        },
        { label: 'Order placed at', fieldName: 'Created_At__c' },
        { 
            label: 'Preparation Time', 
            fieldName: 'formattedPrepTime',
            type: 'text'
        }
    ];

    preparationTimes = [];
    selectedOrderId;
    isPreparationTimeModalOpen = false;

    @wire(getPreparationTimes)
    wiredPrepTimes({ error, data }) {
        if (data) {
            this.preparationTimes = data.map(pt => ({
                label: `${pt.Name} (${this.formatPreparationTime(pt.Time_In_Minutes__c)})`,
                value: pt.Id
            }));
        } else if (error) {
            this.showToast('Error', 'Error loading preparation times: ' + error.message, 'error');
        }
    }

    openPrepTimeModal(event) {
        const orderId = event.target.dataset.orderid;
        this.selectedOrderId = orderId;
        this.isPreparationTimeModalOpen = true;
    }

    closePrepTimeModal() {
        this.isPreparationTimeModalOpen = false;
        this.selectedOrderId = null;
    }

    handlePrepTimeSelect(event) {
        const prepTimeId = event.detail.value;
        
        updateOrderPrepTime({ orderId: this.selectedOrderId, prepTimeId: prepTimeId })
            .then(() => {
                this.showToast('Success', 'Preparation time updated successfully', 'success');
                this.closePrepTimeModal();
                return this.refreshData();
            })
            .catch(error => {
                this.showToast('Error', 'Failed to update preparation time: ' + error.message, 'error');
            });
    }

    @wire(getOrderData)
    wiredOrderData({ error, data }) {
        if (data) {
            // Create a deep clone of the data to modify it
            let processedData = JSON.parse(JSON.stringify(data));
            
            // Process the data to add computed fields
            processedData = processedData.map(order => {
                const chefName = order.User_Id__r ? 
                    `${order.User_Id__r.First_Name__c || ''} ${order.User_Id__r.Last_Name__c || ''}`.trim() : 
                    'Unassigned';
                
                // Get preparation time from the lookup relationship, ensuring it exists
                const prepTimeMinutes = order.Preparation_Time__r && order.Preparation_Time__r.Time_In_Minutes__c ? 
                    order.Preparation_Time__r.Time_In_Minutes__c : 
                    null;
                
                // Format preparation time
                const formattedPrepTime = this.formatPreparationTime(prepTimeMinutes);
                
                return {
                    ...order,
                    chefName: chefName || 'Unassigned',
                    formattedPrepTime,
                    prepTimeName: order.Preparation_Time__r ? order.Preparation_Time__r.Name : 'Not Set'
                };
            });
            
            this.allOrders = processedData;
            
            this.filterOrders(); // Call the filter method after data is fetched

            this.newOrders = processedData.filter(order => order.Status__c === 'New');
            this.inProgressOrders = processedData.filter(order => order.Status__c === 'Processing');
            this.readyOrders = processedData.filter(order => order.Status__c === 'Ready');
            this.servedOrders = processedData.filter(order => order.Status__c === 'Served');
        } else if (error) {
            this.errorMessage = 'Error fetching order data: ' + error.body.message;
            console.error('Error fetching order data: ', error);
        }
    }

    // Search and filter orders by any relevant attributes
    filterOrders() {
        let filteredOrders = this.allOrders;

        // If the search term is not empty, filter by relevant fields (e.g., Chef Name, Order #, etc.)
        if (this.searchKeyword) {
            filteredOrders = filteredOrders.filter(order => {
                return order.OTID__c && order.OTID__c.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
                       order.First_Name__c && order.First_Name__c.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
                       order.Last_Name__c && order.Last_Name__c.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
                       order.chefName.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
                       order.Status__c.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
                       order.formattedPrepTime.toLowerCase().includes(this.searchKeyword.toLowerCase());
            });
        }

        // Split orders into statuses after filtering
        this.newOrders = filteredOrders.filter(order => order.Status__c === 'New');
        this.inProgressOrders = filteredOrders.filter(order => order.Status__c === 'Processing');
        this.readyOrders = filteredOrders.filter(order => order.Status__c === 'Ready');
        this.servedOrders = filteredOrders.filter(order => order.Status__c === 'Served');
    }

    // Handle input changes in the search box
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

    refreshData() {
        return refreshApex(this.allOrders);
    }

    connectedCallback() {
        this.intervalId = setInterval(() => {
            this.refreshData();
        }, 30000); 

        this.autoUpdateOrderStatus();
    }

    disconnectedCallback() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    autoUpdateOrderStatus() {
        setInterval(() => {
            this.inProgressOrders.forEach(order => {
                if (this.shouldUpdateOrderStatus(order)) {
                    this.updateOrderStatus(order);
                }
            });
        }, this.autoStatusUpdateInterval);
    }

    shouldUpdateOrderStatus(order) {
        const processingTime = new Date() - new Date(order.CreatedDate);
        return processingTime > 3600000;
    }

    updateOrderStatus(order) {
        const newStatus = 'Ready'; 
        updateOrder({ orderList: [{ Id: order.Id, Status__c: newStatus }] })
            .then(() => {
                this.refreshData();
                this.showToast('Success', `Order ${order.OTID__c} status updated to ${newStatus}`, 'success');
            })
            .catch(error => {
                this.errorMessage = error.message;
                this.showToast('Error', this.errorMessage, 'error');
            });
    }

    formatDate(date) {
        if (date) {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(date).toLocaleDateString(undefined, options);
        }
        return '';
    }

    formatTime(time) {
        if (time) {
            const options = { hour: '2-digit', minute: '2-digit' };
            return new Date(time).toLocaleTimeString(undefined, options);
        }
        return '';
    }

    formatPreparationTime(minutes) {
        if (minutes == null) return 'Not Set';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours} hr ${mins} min`;
    }
}
