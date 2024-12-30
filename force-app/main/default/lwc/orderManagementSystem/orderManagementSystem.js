
import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';
import getOrders from '@salesforce/apex/orderManagementSystem.getOrders';
import deleteOrder from '@salesforce/apex/orderManagementSystem.deleteOrder';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class OrderManagementSystem extends NavigationMixin(LightningElement) {
    @track data = [];
    wiredOrdersResult;
    isEditModalOpen = false;
    @track currentOrder = {};

    statusOptions = [
        { label: 'Preparing', value: 'Preparing' },
        { label: 'Ready', value: 'Ready' },
        { label: 'On Hold', value: 'On Hold' },
        { label: 'Served', value: 'Served' },
        { label: 'Delivered', value: 'Delivered' },
        { label: 'Cancelled', value: 'Cancelled' }
    ];


    // Columns for the lightning datatable
    columns = [
        { label: 'Order ID', fieldName: 'OTID__c' },
        { label: 'First Name', fieldName: 'First_Name__c' },
        { label: 'Middle Name', fieldName: 'Middle_Name__c' },
        { label: 'Last Name', fieldName: 'Last_Name__c' },
        { label: 'Mobile', fieldName: 'Mobile__c' },
        { label: 'Email', fieldName: 'Email__c' },
        { label: 'Token', fieldName: 'Token__c' },
        { label: 'Status', fieldName: 'Status__c' },
        { label: 'Created By', fieldName: 'CreatedById' },
        { label: 'Created At', fieldName: 'Created_At__c' },
        { label: 'Updated At', fieldName: 'Updated_At__c' },
        { label: 'Owner ID', fieldName: 'OwnerId' },
        { label: 'Vendor ID', fieldName: 'Vendor_Id__c' },
        { label: 'User ID', fieldName: 'User_Id__c' },
        { label: 'Last Modified', fieldName: 'LastModifiedById' },
        { label: 'Shipping Address', fieldName: 'Shipping__c' },
        { label: 'Address 1', fieldName: 'Line_1__c' },
        { label: 'Address 2', fieldName: 'Line_2__c' },
        { label: 'City', fieldName: 'City__c' },
        { label: 'Province', fieldName: 'Province__c' },
        { label: 'Country', fieldName: 'Country__c' },
        { label: 'Sub Total', fieldName: 'Sub_Total__c' },
        { label: 'Total', fieldName: 'Total__c' },
        { label: 'Discount', fieldName: 'Discount__c' },
        { label: 'Promo', fieldName: 'Promo__c' },
        { label: 'Item Discount', fieldName: 'Item_Discount__c' },
        { label: 'Content', fieldName: 'Content__c' },
        { label: 'Tax', fieldName: 'Tax__c' },
        { label: 'Grand Total', fieldName: 'Grand_Total__c' },
        {
            type: 'action',
            typeAttributes: {
                rowActions: [
                    {
                        label: 'Edit',
                        name: 'edit',
                        type: 'button-icon',
                        typeAttributes: {
                            name: 'Edit',
                            title: 'Edit',
                            iconName: 'utility:edit'
                        }
                    },
                    {
                        label: 'Delete',
                        name: 'delete',
                        type: 'button-icon',
                        typeAttributes: {
                            name: 'Delete',
                            title: 'Delete',
                            iconName: 'utility:delete',
                            iconClass: 'slds-icon-text-error'
                        }
                    }
                ]
            }
        }
    ];

    // Wire getOrders Apex method
    @wire(getOrders)
    wiredOrders(result) {
        this.wiredOrdersResult = result;
        const { data, error } = result;
        if (data) {
            this.data = data;
        } else if (error) {
            this.showToast('Error', 'Failed to fetch orders', 'error');
        }
    }

    // Handle row actions (Edit and Delete)
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        switch (actionName) {
            case 'edit':
                this.handleEdit(row);
                break;
            case 'delete':
                this.handleDelete(row);
                break;
        }
    }

    // Handle editing an order
    handleEdit(row) {
        // Deep copy of the row to avoid mutations
        this.currentOrder = { ...row };
        console.log('Editing order - Status__c:', this.currentOrder.Status__c);
        console.log('Available Status Options:', this.statusOptions);
        this.isEditModalOpen = true;
    }

    // Unified change handler for modal inputs
    handleInputChange(event) {
        const { name, value } = event.target;

        // Defensive check to ensure name exists
        if (!name) {
            console.warn('Input change event without a name attribute');
            return;
        }

        // Map input names to corresponding order fields
        const fieldMap = {
            'Order ID': 'OTID__c',
            'firstName': 'First_Name__c',
            'middleName': 'Middle_Name__c',
            'lastName': 'Last_Name__c',
            'mobile': 'Mobile__c',
            'email': 'Email__c',
            'status': 'Status__c',
            'token': 'Token__c',
            'shipping Address': 'Shipping__c',
            'address 1': 'Line_1__c',
            'address 2': 'Line_2__c',
            'city': 'City__c',
            'province': 'Province__c',
            'country': 'Country__c',
            'sub Total': 'Sub_Total__c',
            'total': 'Total__c',
            'discount': 'Discount__c',
            'promo': 'Promo__c',
            'item Discount': 'Item_Discount__c',
            'content': 'Content__c',
            'tax': 'Tax__c',
            'grand Total': 'Grand_Total__c'
        };

        // Update the corresponding field in currentOrder
        const fieldName = fieldMap[name];
        if (fieldName) {
            // Create a new object to trigger reactivity
            this.currentOrder = {
                ...this.currentOrder,
                [fieldName]: value
            };
        } else {
            console.warn(`No mapping found for input name: ${name}`);
        }
    }

    // Validate fields before saving the order
    validateFields() {
        const { First_Name__c, Last_Name__c, Email__c, Status__c } = this.currentOrder;

        // First Name and Last Name validation
        if (!First_Name__c || !Last_Name__c) {
            this.showToast('Error', 'First Name and Last Name are required.', 'error');
            return false;
        }

        // Email validation: Ensure it has a domain
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!Email__c || !emailPattern.test(Email__c)) {
            this.showToast('Error', 'Email is required and should have a valid domain.', 'error');
            return false;
        }

        // Status validation
        if (!Status__c) {
            this.showToast('Error', 'Status is required.', 'error');
            return false;
        }

        return true;
    }

    // Handle saving the updated order using updateRecord
    handleSaveOrder() {
        if (!this.validateFields()) {
            return;
        }

        // Log the currentOrder fields to ensure they're populated
        console.log('Current Order fields:', this.currentOrder);

        const fields = {
            Id: this.currentOrder.Id,
            First_Name__c: this.currentOrder.First_Name__c,
            Middle_Name__c: this.currentOrder.Middle_Name__c,
            Last_Name__c: this.currentOrder.Last_Name__c,
            Mobile__c: this.currentOrder.Mobile__c,
            Email__c: this.currentOrder.Email__c,
            Status__c: this.currentOrder.Status__c,
            Token__c: this.currentOrder.Token__c,
            Shipping__c: this.currentOrder.Shipping__c,
            Line_1__c: this.currentOrder.Line_1__c,
            Line_2__c: this.currentOrder.Line_2__c,
            City__c: this.currentOrder.City__c,
            Province__c: this.currentOrder.Province__c,
            Country__c: this.currentOrder.Country__c,
            Sub_Total__c: this.currentOrder.Sub_Total__c,
            Total__c: this.currentOrder.Total__c,
            Discount__c: this.currentOrder.Discount__c,
            Promo__c: this.currentOrder.Promo__c,
            Item_Discount__c: this.currentOrder.Item_Discount__c,
            Content__c: this.currentOrder.Content__c,
            Tax__c: this.currentOrder.Tax__c,
            Grand_Total__c: this.currentOrder.Grand_Total__c
        };

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.showToast('Success', 'Order updated successfully', 'success');
                this.isEditModalOpen = false;
                this.refreshData();
            })
            .catch((error) => {
                // Log the error to the console for debugging
                console.error('Error details:', JSON.stringify(error));
               
                // Display a detailed toast message
                let errorMessage = error.body ? error.body.message : 'Unknown error';
                this.showToast('Error', `Failed to update order: ${errorMessage}`, 'error');
            });
    }

    // Handle modal close
    handleModalClose() {
        this.isEditModalOpen = false;
    }

    // Handle deleting an order
    handleDelete(row) {
        deleteOrder({ orderId: row.Id })
            .then(() => {
                this.showToast('Success', 'Order deleted successfully', 'success');
                this.refreshData();
            })
            .catch((error) => {
                this.showToast('Error', `Failed to delete order: ${error.body.message}`, 'error');
            });
    }

    // Handle creating a new order
    handleNewOrder() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Order_Table__c',
                actionName: 'home'
            }
        }).catch(error => {
            console.error('Navigation error:', error);
            this.showToast('Error', 'Unable to navigate to new order page', 'error');
        });
    }

    // Refresh the data in the table
    refreshData() {
        return refreshApex(this.wiredOrdersResult);
    }

    // Show toast messages
    showToast(title, message, variant) {
        const toast = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(toast);
    }
}