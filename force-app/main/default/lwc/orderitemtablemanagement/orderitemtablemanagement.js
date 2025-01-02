import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord, createRecord } from 'lightning/uiRecordApi'; // Added createRecord for insertion
import getOrderItems from '@salesforce/apex/OrderItemTable.getOrderItems';
import deleteOrderItem from '@salesforce/apex/OrderItemTable.deleteOrderItem';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import ORDER_ITEM_OBJECT from '@salesforce/schema/Order_Item_Table__c'; // Import the object schema

export default class OrderItemTable extends NavigationMixin(LightningElement) {
    @track data = [];
    wiredOrderItemsResult;
    isEditModalOpen = false;
    @track currentOrderItem = {};
    @track upsertLabel = 'Edit'; // Used to change modal title to 'Insert' or 'Edit'

    // Columns for the data table
    columns = [
        { label: 'OITID', fieldName: 'OITID__c' },
        { label: 'Order ID', fieldName: 'Order_Id__c' },
        { label: 'Name', fieldName: 'Name' },
        { label: 'Order', fieldName: 'Order__c'},
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

    // Fetch order items using wire service
    @wire(getOrderItems)
    wiredOrderItems(result) {
        this.wiredOrderItemsResult = result;
        const { data, error } = result;
        if (data) {
            this.data = data;
        } else if (error) {
            this.showToast('Error', 'Failed to fetch order items', 'error');
        }
    }

    // Handle row actions (Edit/Delete)
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

    // Open edit modal for a specific row
    handleEdit(row) {
        if (!row) {
            console.error('Error: No row data available for editing.');
            return;
        }
        this.upsertLabel = 'Edit'; // Set label to Edit when editing
        this.currentOrderItem = { ...row }; // Create a copy of the row data
        this.isEditModalOpen = true;
    }

    // Open modal for creating a new order item
    handleAddNew() {
        this.upsertLabel = 'Insert'; // Change label to Insert when creating new record
        this.currentOrderItem = {}; // Clear the current data
        this.isEditModalOpen = true;
    }

    // Handle input changes in the edit modal
    handleInputChange(event) {
        const { name, value } = event.target;
        console.log(name, value);
        this.currentOrderItem = {
            ...this.currentOrderItem,
            [name]: value
        };
    }

    // Validate fields before saving
    validateFields() {
        const { Name, Price__c, Quantity__c } = this.currentOrderItem;

        if (!Name) {
            this.showToast('Error', 'Name is required', 'error');
            return false;
        }

        if (Price__c !== null && (isNaN(Price__c) || Price__c < 0)) {
            this.showToast('Error', 'Price must be a positive number', 'error');
            return false;
        }

        if (Quantity__c !== null && (isNaN(Quantity__c) || Quantity__c < 0)) {
            this.showToast('Error', 'Quantity must be a positive number', 'error');
            return false;
        }

        return true;
    }

    // Handle saving the order item (either create or update)
    handleSaveOrderItem() {
        if (!this.validateFields()) {
            return;
        }

        const fields = { ...this.currentOrderItem };

        if (!this.currentOrderItem.Id) {
            // Create new order item
            const recordInput = { apiName: ORDER_ITEM_OBJECT.objectApiName, fields };

            createRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Order item added successfully', 'success');
                    this.isEditModalOpen = false;
                    return this.refreshData();
                })
                .catch((error) => {
                    this.showToast('Error', `Failed to add order item: ${error.body.message}`, 'error');
                });
        } else {
            // Update existing order item
            const recordInput = { fields };

            updateRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Order item updated successfully', 'success');
                    this.isEditModalOpen = false;
                    return this.refreshData();
                })
                .catch((error) => {
                    this.showToast('Error', `Failed to update order item: ${error.body.message}`, 'error');
                });
        }
    }

    // Handle modal close
    handleModalClose() {
        this.isEditModalOpen = false;
    }

    // Delete an order item
    handleDelete(row) {
        deleteOrderItem({ orderItemId: row.Id })
            .then(() => {
                this.showToast('Success', 'Order item deleted successfully', 'success');
                return this.refreshData();
            })
            .catch((error) => {
                this.showToast('Error', `Failed to delete order item: ${error.body.message}`, 'error');
            });
    }

    // Refresh the data in the table
    refreshData() {
        return refreshApex(this.wiredOrderItemsResult);
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
