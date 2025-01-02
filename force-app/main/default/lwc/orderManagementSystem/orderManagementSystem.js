import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';
//import getOrders from '@salesforce/apex/OrderManagementSystem.getOrders'; //
import deleteOrder from '@salesforce/apex/OrderManagementSystem.deleteOrder';
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
    /*@wire(getOrders)
    wiredOrders(result) {
        this.wiredOrdersResult = result;
        const { data, error } = result;
        if (data) {
            this.data = data;
        } else if (error) {
            this.showToast('Error', 'Failed to fetch orders', 'error');
        }
    } */

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
        this.currentOrder = { ...row };
        this.isEditModalOpen = true;
    }

    // Handle saving the updated order
    handleSaveOrder() {
        const fields = { ...this.currentOrder };

        const recordInput = { fields };
        updateRecord(recordInput)
            .then(() => {
                this.showToast('Success', 'Order updated successfully', 'success');
                this.isEditModalOpen = false;
                this.refreshData();
            })
            .catch((error) => {
                this.showToast('Error', `Failed to update order: ${error.body.message}`, 'error');
            });
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
