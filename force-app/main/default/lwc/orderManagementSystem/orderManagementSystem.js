

import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord, createRecord } from 'lightning/uiRecordApi';
import getOrderItems from '@salesforce/apex/OrderItemTable.getOrderItems';
import deleteOrderItem from '@salesforce/apex/OrderItemTable.deleteOrderItem';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import ORDER_ITEM_OBJECT from '@salesforce/schema/Order_Item_Table__c';

export default class OrderItemTable extends NavigationMixin(LightningElement) {
    @track data = [];
    wiredOrderItemsResult;
    isEditModalOpen = false;
    currentOrderItem = {};
    upsertLabel = 'Edit';

    columns = [
        { label: 'OITID', fieldName: 'OITID__c' },
        { label: 'Order ID', fieldName: 'Order_Id__c' },
        { label: 'Name', fieldName: 'Name' },
        { label: 'First Name', fieldName: '	First_Name__c' },
        { label: 'Middle Name', fieldName: 'Middle_Name__c' },
        { label: 'Last Name', fieldName: 'Last_Name__c' },
        { label: 'Content', fieldName: 'Content__c' },
        { label: 'Created By', fieldName: 'CreatedById' },
        { label: 'Discount', fieldName: 'Discount__c' },
        { label: 'Item ID', fieldName: 'Item_Id__c' },
        { label: 'Last Modified By', fieldName: 'LastModifiedById' },
        { label: 'Updated At', fieldName: 'Updated_At__c' },
        { label: 'Owner ID', fieldName: 'OwnerId' },
        { label: 'Price', fieldName: 'Price__c' },
        { label: 'Quantity', fieldName: 'Quantity__c' },
        { label: 'SKU', fieldName: 'SKU__c' },
        { label: 'Unit', fieldName: 'Unit__c' },
        {
            type: 'action',
            typeAttributes: {
                rowActions: [
                    {
                        label: 'Edit',
                        name: 'edit',
                        type: 'button-icon',
                        typeAttributes: { name: 'Edit', title: 'Edit', iconName: 'utility:edit' }
                    },
                    {
                        label: 'Delete',
                        name: 'delete',
                        type: 'button-icon',
                        typeAttributes: { name: 'Delete', title: 'Delete', iconName: 'utility:delete', iconClass: 'slds-icon-text-error' }
                    }
                ]
            }
        }
    ];

    @wire(getOrderItems)
    wiredOrderItems(result) {
        this.wiredOrderItemsResult = result;
        const { data, error } = result;

        if (data) {
            this.data = data;
            const firstRecord = data[0];
            const orderId = firstRecord?.Order_Id__c;

            if (orderId) {
                console.log(orderId);
            } else {
                console.log('Order_Id__c is not available or data is empty');
            }
        } else if (error) {
            this.showToast('Error', 'Failed to fetch order items', 'error');
        }
    }

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

    handleEdit(row) {
        this.upsertLabel = 'Edit';
        this.currentOrderItem = { ...row };
        this.isEditModalOpen = true;
    }

    handleAddNew() {
        this.upsertLabel = 'Insert';
        this.currentOrderItem = {};
        this.isEditModalOpen = true;
    }

    handleInputChange(event) {
        const { name, value } = event.target;
        this.currentOrderItem = { ...this.currentOrderItem, [name]: value };
    }

    handleSaveOrderItem() {
        const fields = { ...this.currentOrderItem };

        if (!this.currentOrderItem.Id) {
            const recordInput = { apiName: ORDER_ITEM_OBJECT.objectApiName, fields };
            createRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Order item added successfully', 'success');
                    this.isEditModalOpen = false;
                    return this.refreshData();
                })
                .catch((error) => {
                    this.showToast('Error', `Failed to add order item: ${error.body?.message || error.message}`, 'error');
                });
        } else {
            const recordInput = { fields };
            updateRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Order item updated successfully', 'success');
                    this.isEditModalOpen = false;
                    return this.refreshData();
                })
                .catch((error) => {
                    this.showToast('Error', `Failed to update order item: ${error.body?.message || error.message}`, 'error');
                });
        }
    }

    handleModalClose() {
        this.isEditModalOpen = false;
    }

    handleDelete(row) {
        deleteOrderItem({ orderItemId: row.Id })
            .then(() => {
                this.showToast('Success', 'Order item deleted successfully', 'success');
                return this.refreshData();
            })
            .catch((error) => {
                this.showToast('Error', `Failed to delete order item: ${error.body?.message || error.message}`, 'error');
            });
    }

    refreshData() {
        return refreshApex(this.wiredOrderItemsResult);
    }

    showToast(title, message, variant) {
        const toast = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(toast);
    }
}